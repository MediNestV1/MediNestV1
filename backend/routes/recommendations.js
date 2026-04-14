require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRole);

const CLASS_TO_DRUG_MAP = {
    "bronchodilator": { meds: ["salbutamol", "ipratropium"], domain: "resp" },
    "antibiotic_r": { meds: ["amoxicillin", "azithromycin"], domain: "resp" },
    "expectorant": { meds: ["ambroxol"], domain: "resp" },
    "antitussive": { meds: ["dextromethorphan", "codeine"], domain: "resp" },
    "decongestant": { meds: ["phenylephrine"], domain: "resp" },
    "steroid_inhaler": { meds: ["fluticasone", "budesonide"], domain: "resp" },
    "nitrate": { meds: ["isosorbide dinitrate"], domain: "cardio" },
    "diuretic": { meds: ["furosemide", "spironolactone"], domain: "cardio" },
    "statin": { meds: ["atorvastatin"], domain: "cardio" },
    "beta_blocker": { meds: ["metoprolol", "propranolol"], domain: "cardio" },
    "ppi": { meds: ["pantoprazole", "omeprazole"], domain: "gi" },
    "antispasmodic": { meds: ["dicyclomine", "hyoscine"], domain: "gi" },
    "antiemetic": { meds: ["domperidone", "ondansetron"], domain: "gi" },
    "prokinetic": { meds: ["itopride", "domperidone"], domain: "gi" },
    "laxative": { meds: ["lactulose", "bisacodyl"], domain: "gi" },
    "probiotic": { meds: ["lactobacillus"], domain: "gi" },
    "ors": { meds: ["oral rehydration salts"], domain: "gi" },
    "antacid": { meds: ["magnesium hydroxide", "aluminum hydroxide"], domain: "gi" },
    "retinoid": { meds: ["adapalene", "benzoyl peroxide"], domain: "derm" },
    "antibiotic_acne": { meds: ["doxycycline"], domain: "derm" },
    "antifungal": { meds: ["clotrimazole", "fluconazole"], domain: "derm" },
    "steroid_topical": { meds: ["betamethasone", "clobetasol"], domain: "derm" },
    "antiparasitic": { meds: ["albendazole", "permethrin"], domain: "derm" },
    "antibiotic_u": { meds: ["nitrofurantoin"], domain: "uro" },
    "alpha_blocker": { meds: ["tamsulosin"], domain: "uro" },
    "antipyretic": { meds: ["paracetamol"], domain: "general" },
    "analgesic": { meds: ["paracetamol"], domain: "general" },
    "antihistamine": { meds: ["cetirizine", "levocetirizine"], domain: "general" },
    "nsaid": { meds: ["aceclofenac", "diclofenac"], domain: "general" },
    "vitamin": { meds: ["zincovit", "multivitamin"], domain: "general" },
    "neurovitamin": { meds: ["methylcobalamin"], domain: "general" },
    "thyroxine": { meds: ["levothyroxine"], domain: "general" },
    "antivertigo": { meds: ["betahistine"], domain: "general" },
    "antibiotic": { meds: ["amoxicillin-clavulanic acid", "azithromycin"], domain: "general" }
};

const CLASS_ALIAS_MAP = {
    "antacids": "ppi",
    "acid_suppressant": "ppi",
    "painkiller": "analgesic",
    "fever": "antipyretic",
    "cough_syrup": "antitussive",
    "anti_allergy": "antihistamine",
    "anti_allergic": "antihistamine",
    "inhaler": "bronchodilator"
};

const PROTOCOL_MASTER = {
    "urti": { must: ["antipyretic"], optional: ["antihistamine", "antitussive"], avoid: ["antibiotic"], sev: "mild", tag: "URTI" },
    "viral_fever": { must: ["antipyretic"], optional: ["analgesic"], avoid: ["antibiotic"], sev: "mild", tag: "Viral Fever" },
    "dengue": { must: ["antipyretic"], optional: [], avoid: ["nsaid"], sev: "moderate", tag: "Dengue" },
    "typhoid": { must: ["antipyretic"], optional: ["antibiotic"], avoid: [], sev: "moderate", tag: "Typhoid" },
    "cough": { must: ["antitussive"], optional: ["antihistamine"], avoid: ["antibiotic"], sev: "mild", tag: "Acute Cough" },
    "allergy": { must: ["antihistamine"], optional: ["decongestant"], avoid: [], sev: "mild", tag: "Allergy" },
    "asthma": { must: ["bronchodilator"], optional: ["steroid_inhaler"], avoid: ["antihistamine"], sev: "moderate", tag: "Asthma" },
    "gastritis": { must: ["ppi"], optional: ["antacid"], avoid: ["nsaid"], sev: "mild", tag: "Gastritis" },
    "gerd": { must: ["ppi"], optional: ["prokinetic"], avoid: [], sev: "mild", tag: "GERD" },
    "uti": { must: ["antibiotic_u"], optional: ["analgesic"], avoid: [], sev: "moderate", tag: "UTI" },
    "constipation": { must: ["laxative"], optional: ["probiotic"], avoid: [], sev: "mild", tag: "Constipation" },
    "vertigo": { must: ["antivertigo"], optional: [], avoid: [], sev: "moderate", tag: "Vertigo" },
    "neuropathy": { must: ["neurovitamin"], optional: [], avoid: [], sev: "moderate", tag: "Neuropathy" },
    "hypothyroid": { must: ["thyroxine"], optional: [], avoid: [], sev: "moderate", tag: "Hypothyroid" },
    "acne": { must: ["retinoid"], optional: ["antibiotic_acne"], avoid: [], sev: "mild", tag: "Acne" },
    "eczema": { must: ["antihistamine"], optional: ["steroid_topical"], avoid: [], sev: "mild", tag: "Eczema" }
};

const CATEGORY_ALLOWED_DOMAINS = {
    "cardio": ["cardio", "general"],
    "neuro": ["general"],
    "resp": ["resp", "general"],
    "gi": ["gi", "general"],
    "derm": ["derm", "general", "resp"],
    "uro": ["uro", "general", "resp"],
    "general": ["general", "gi", "resp", "uro"]
};

function normalizeClass(cls) {
    if (!cls) return null;
    const cleaned = cls.toLowerCase().trim().replace(/\s+/g, "_");
    // direct match
    if (CLASS_TO_DRUG_MAP[cleaned]) return cleaned;
    // alias match
    if (CLASS_ALIAS_MAP[cleaned]) return CLASS_ALIAS_MAP[cleaned];
    return null;
}

function fallbackFromDiagnosis(diagnosis) {
    if (!diagnosis) return [];
    const d = diagnosis.toLowerCase();
    if (d.includes("fever")) return ["antipyretic"];
    if (d.includes("urti")) return ["antipyretic", "antihistamine"];
    if (d.includes("cough")) return ["antitussive"];
    if (d.includes("gastritis")) return ["ppi"];
    return [];
}

function parseClinicalJson(content) {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        return JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    } catch (e) {
        return { severity: "moderate", category: "general", probable_diagnosis: "Clinical Evaluation Required", required_classes: [], advice: ["Follow clinical protocols."] };
    }
}

async function suggestClinicalPath(cc, findings, context = {}) {
    try {
        const { age, gender, specialty } = context;
        const systemPrompt = `You are an elite clinical engine. Detect red flags but avoid over-triage. 
        Return required_classes ONLY from: antipyretic, analgesic, antibiotic_r, antitussive, bronchodilator, ppi, antihistamine, antiemetic, ors.
        
        Do NOT use: Antacids, General Medicine, Painkillers (use analgesic instead).

        JSON ONLY: { "severity": "mild|moderate|emergency", "category": "cardio|neuro|resp|gi|derm|uro|general", "probable_diagnosis": "", "differentials": [], "investigations": { "primary": [], "secondary": [] }, "required_classes": [], "advice": ["item1", "item2"], "confidence": 0-1 }`;

        const aiResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "meta/llama-3.1-8b-instruct",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Case: ${age}y ${gender} CC: ${cc}` }],
                temperature: 0.1
            })
        });

        const aiData = await aiResponse.json();
        const clinicalIntent = parseClinicalJson(aiData.choices?.[0]?.message?.content || "");

        let severity = clinicalIntent.severity || "moderate";
        let category = clinicalIntent.category || "general";
        let diagnosis = (clinicalIntent.probable_diagnosis || "").toLowerCase();
        
        // Tier 5.5 Normalization & Aliasing
        let classes = (clinicalIntent.required_classes || [])
            .map(normalizeClass)
            .filter(Boolean);

        // Deterministic Fallback if AI output is disconnected
        if (classes.length === 0) {
            classes = fallbackFromDiagnosis(diagnosis);
        }

        let activeTags = [];
        Object.keys(PROTOCOL_MASTER).forEach(key => {
            if (diagnosis.includes(key)) {
                const p = PROTOCOL_MASTER[key];
                activeTags.push(p.tag);
                if (severity !== 'emergency') severity = p.sev;
                // Augment with must + optional
                classes = [...new Set([...classes, ...p.must, ...(p.optional || [])])];
                // Remove avoid list
                if (p.avoid) {
                    classes = classes.filter(c => !p.avoid.includes(c));
                }
            }
        });

        const allowed = CATEGORY_ALLOWED_DOMAINS[category] || ["general"];
        classes = classes.filter(c => {
            const meta = CLASS_TO_DRUG_MAP[c.toLowerCase().trim()];
            return !meta || allowed.includes(meta.domain);
        });

        if (severity === 'emergency') {
            classes = [];
            diagnosis = "Serious condition — requires urgent evaluation";
        }

        // Limit to 4 medications (Polypharmacy Cap)
        classes = classes.slice(0, 4);

        const adviceList = Array.isArray(clinicalIntent.advice) ? clinicalIntent.advice : [clinicalIntent.advice || "Follow clinical protocols."];
        const finalAdvice = adviceList.map(a => `• ${a.trim()}`);
        if (activeTags.length > 0) finalAdvice.unshift(`• PROTOCOL: ${activeTags.join(' | ')}`);

        const finalRecommendationsMap = new Map();
        const usedGenerics = new Set();
        for (const intentKey of classes) {
            const meta = CLASS_TO_DRUG_MAP[intentKey.toLowerCase().trim()];
            if (meta) {
                for (const g of meta.meds) {
                    if (usedGenerics.has(g.toLowerCase()) || usedGenerics.size >= 4) continue;
                    usedGenerics.add(g.toLowerCase());
                    const { data: brands } = await supabase.rpc('search_medicines_v2', { search_term: g });
                    const safeBrands = (brands || []).filter(b => !/(inj|iv|im)/i.test((b.name + (b.dosage_form || ''))));
                    if (safeBrands.length > 0) {
                        finalRecommendationsMap.set(g.toLowerCase(), { drug: g, reason: `Clinical Guideline`, brands: safeBrands.slice(0, 3).map(b => ({ id: b.id, name: b.name, price: b.price || 'N/A', emoji: '💊' })) });
                    }
                }
            }
        }

        return { probable_diagnosis: clinicalIntent.probable_diagnosis || diagnosis, recommendations: Array.from(finalRecommendationsMap.values()), advice: finalAdvice.join('\n'), differentials: clinicalIntent.differentials || [], investigations: clinicalIntent.investigations || { primary: [], secondary: [] }, severity: severity, confidence: clinicalIntent.confidence || 0 };
    } catch (err) { return { error: err.message }; }
}

router.post('/suggest', async (req, res) => {
    const { cc, findings, age, gender, specialty } = req.body;
    const suggestions = await suggestClinicalPath(cc, findings, { age, gender, specialty });
    res.json({ success: true, suggestions });
});

module.exports = router;
module.exports.suggestClinicalPath = suggestClinicalPath;
