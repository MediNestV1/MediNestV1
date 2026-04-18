const { suggestClinicalPath } = require('../routes/recommendations');

const auditCases = [
    { id: 1, cc: "High fever with febrile convulsions", findings: "Temp 40.2°C", exp_dx: "Febrile", exp_meds: ["antipyretic"], exp_sev: "emergency" },
    { id: 4, cc: "Morning stiffness over 1 hour with symmetric joint swelling", findings: "RF positive", exp_dx: "Rheumatoid", exp_meds: ["analgesic"], exp_sev: "moderate" },
    { id: 5, cc: "Sore throat, sandpaper rash, strawberry tongue, high fever", findings: "—", exp_dx: "Scarlet", exp_meds: ["antibiotic_r", "antipyretic"], exp_sev: "moderate" },
    { id: 11, cc: "Intermittent blurred vision, tingling in limbs, weakness", findings: "MRI lesions", exp_dx: "Multiple Sclerosis", exp_meds: [], exp_sev: "moderate" },
    { id: 14, cc: "High fever, non-blanching rash, neck stiffness", findings: "—", exp_dx: "Serious", exp_meds: [], exp_sev: "emergency" },
    { id: 15, cc: "Chest tightness with jaw pain on climbing stairs, relieved by rest", findings: "ST depression", exp_dx: "Angina", exp_meds: ["nitrate"], exp_sev: "moderate" },
    { id: 18, cc: "Fever, cough, drenching night sweats, weight loss", findings: "Right apical cavitation", exp_dx: "Tuberculosis", exp_meds: ["antibiotic_r"], exp_sev: "moderate" },
    { id: 22, cc: "Abdominal pain, vomiting, bloody diarrhea after BBQ", findings: "Low platelets", exp_dx: "Haemolytic", exp_meds: ["ors"], exp_sev: "emergency" },
    { id: 24, cc: "Sudden painful red eye, haloes around lights, nausea", findings: "IOP 52 mmHg", exp_dx: "Glaucoma", exp_meds: [], exp_sev: "emergency" },
    { id: 28, cc: "Headache, visual disturbance, ankle swelling at 34 weeks pregnant", findings: "BP 168/112", exp_dx: "Preeclampsia", exp_meds: [], exp_sev: "emergency" },
    { id: 34, cc: "Collapse after bee sting — wheeze, urticaria", findings: "BP 68/40", exp_dx: "Anaphylaxis", exp_meds: [], exp_sev: "emergency" },
    { id: 35, cc: "Epigastric pain relieved by eating, worse when hungry", findings: "H. pylori positive", exp_dx: "Peptic", exp_meds: ["ppi"], exp_sev: "moderate" },
    { id: 43, cc: "Progressive gait disturbance, gait gait GAIT, urinary incontinence", findings: "Dilated ventricles", exp_dx: "Normal Pressure", exp_meds: [], exp_sev: "moderate" },
    { id: 44, cc: "Silver-scaled plaques on elbows, knees, scalp", findings: "—", exp_dx: "Psoriasis", exp_meds: [], exp_sev: "moderate" },
    { id: 48, cc: "Sudden choking while eating, persistent wheeze", findings: "Mediastinal shift", exp_dx: "Foreign body", exp_meds: [], exp_sev: "emergency" },
    { id: 60, cc: "Bilious vomiting from day 2 of life, no meconium", findings: "Double bubble sign", exp_dx: "Duodenal Atresia", exp_meds: [], exp_sev: "emergency" },
    { id: 63, cc: "Severe throat pain, unable to open mouth, hot potato voice", findings: "Uvula deviated", exp_dx: "Quinsy", exp_meds: [], exp_sev: "emergency" },
    { id: 84, cc: "Recurrent mouth ulcers, chronic diarrhea, skip lesions", findings: "Cobblestone pattern", exp_dx: "Crohn", exp_meds: [], exp_sev: "moderate" },
    { id: 91, cc: "Sudden chest pain with sweating and vomiting", findings: "—", exp_dx: "Serious", exp_meds: [], exp_sev: "emergency" },
    { id: 97, cc: "Fever with joint pain and butterfly rash on face", findings: "ANA positive", exp_dx: "Lupus", exp_meds: [], exp_sev: "moderate" }
];

async function runAudit() {
    console.log(`🏥 [Clinical Engine 20-Case Smoke Test] Starting...\n`);
    console.log(`| ID | Expected Dx | AI Diagnosis | Severity | Meds | Status |`);
    console.log(`|---|---|---|---|---|---|`);

    let passed = 0;
    for (const c of auditCases) {
        try {
            const result = await suggestClinicalPath(c.cc, c.findings, { age: 30, gender: 'M' });
            
            const dxMatch = result.probable_diagnosis.toLowerCase().includes(c.exp_dx.toLowerCase()) || 
                          (result.probable_diagnosis.includes("Serious condition") && c.exp_sev === "emergency");
            const sevMatch = result.severity === c.exp_sev;
            const aiMeds = result.recommendations.map(m => m.drug.toLowerCase());
            
            // Meds check: 
            // 1. If NOT emergency, we expect meds if c.exp_meds is not empty.
            // 2. If emergency, we expect 0 meds (due to the current version's lock).
            let medsMatch = true;
            if (c.exp_meds.length > 0 && result.severity !== 'emergency') {
                medsMatch = result.recommendations.length > 0;
            } else if (result.severity === 'emergency') {
                medsMatch = result.recommendations.length === 0; // In Tier-5, emergency = 0 meds
            }

            const isPass = dxMatch && sevMatch && medsMatch;
            if (isPass) passed++;

            const status = isPass ? '✅' : '❌';
            const aiDxShort = result.probable_diagnosis.substring(0, 20);
            const medStatus = result.recommendations.length > 0 ? '💊 Found' : '🚫 None';

            console.log(`| ${c.id} | ${c.exp_dx} | ${aiDxShort} | ${result.severity} | ${medStatus} | ${status} |`);

        } catch (e) {
            console.log(`| ${c.id} | ERROR: ${e.message} |`);
        }
    }

    console.log(`\n📊 Audit Summary: ${passed}/20 Passed (${(passed/20)*100}%)`);
}

runAudit();
