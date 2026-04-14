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
    "nitrate": { meds: ["isosorbide dinitrate"], domain: "cardio" },
    "ppi": { meds: ["pantoprazole", "omeprazole"], domain: "gi" },
    "antispasmodic": { meds: ["dicyclomine"], domain: "gi" },
    "antiemetic": { meds: ["domperidone", "ondansetron"], domain: "gi" },
    "stool softener": { meds: ["lactulose", "ispaghula husk"], domain: "gi" },
    "ors": { meds: ["oral rehydration salts"], domain: "gi" },
    "retinoid": { meds: ["adapalene", "benzoyl peroxide"], domain: "derm" },
    "antibiotic_acne": { meds: ["doxycycline"], domain: "derm" },
    "antifungal": { meds: ["clotrimazole"], domain: "derm" },
    "antibiotic_u": { meds: ["nitrofurantoin"], domain: "uro" },
    "antipyretic": { meds: ["paracetamol"], domain: "general" },
    "analgesic": { meds: ["paracetamol"], domain: "general" },
    "antihistamine": { meds: ["cetirizine", "chlorpheniramine"], domain: "general" },
    "multivitamin": { meds: ["zincovit"], domain: "general" }
};

const PROTOCOL_MASTER = {
    "asthma": { must: ["bronchodilator"], block: ["antihistamine"], sev: "moderate", tag: "[ASTHMA PROTOCOL]" },
    "angina": { must: ["nitrate"], block: ["ppi"], sev: "moderate", tag: "[ANGINA PROTOCOL]" },
    "uti": { must: ["antibiotic_u"], block: ["ppi"], sev: "moderate", tag: "[UTI PROTOCOL]" },
    "acne": { must: ["retinoid"], block: ["antifungal"], sev: "moderate", tag: "[ACNE PROTOCOL]" },
    "pyelonephritis": { must: ["antibiotic_u"], block: [], sev: "moderate", tag: "[PYELONEPHRITIS PROTOCOL]" },
    "epididymitis": { must: ["antibiotic_r"], block: [], sev: "moderate", tag: "[EPIDIDYMITIS PROTOCOL]" }
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
        const systemPrompt = `You are an elite clinical engine. Detect red flags but avoid over-triage for stable cases. 
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
        let classes = clinicalIntent.required_classes || [];

        let activeTags = [];
        Object.keys(PROTOCOL_MASTER).forEach(key => {
            if (diagnosis.includes(key)) {
                const p = PROTOCOL_MASTER[key];
                activeTags.push(p.tag);
                severity = p.sev;
                p.must.forEach(c => { if (!classes.includes(c)) classes.push(c); });
                classes = classes.filter(c => !p.block.includes(c));
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

        const finalAdvice = (clinicalIntent.advice || []).map(a => `• ${a.trim()}`);
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
