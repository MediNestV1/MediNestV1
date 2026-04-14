require('dotenv').config();
const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    { id: 1, age: 54, gender: "Male", specialty: "General Physician", cc: "Chest tightness while walking uphill since 3 days, relieved on rest", findings: "BP 150/90" },
    { id: 2, age: 23, gender: "Female", specialty: "Dermatologist", cc: "Itchy red rash over hands after using new detergent", findings: "Allergic Contact Dermatitis" },
    { id: 3, age: 67, gender: "Male", specialty: "Cardiologist", cc: "Sudden severe chest pain radiating to jaw with sweating since 1 hour", findings: "" },
    { id: 4, age: 35, gender: "Female", specialty: "Gynecologist", cc: "Lower abdominal pain with white vaginal discharge since 5 days", findings: "Mild tenderness lower abdomen" },
    { id: 5, age: 8, gender: "Male", specialty: "Pediatrician", cc: "Fever with rash over body and itching since 2 days", findings: "" },
    { id: 6, age: 45, gender: "Male", specialty: "Orthopedic", cc: "Knee pain worse on climbing stairs since 6 months", findings: "Osteoarthritis" },
    { id: 7, age: 29, gender: "Female", specialty: "General Physician", cc: "Loose motions 8–10 times with mild fever since yesterday", findings: "Mild dehydration" },
    { id: 8, age: 60, gender: "Male", specialty: "Neurologist", cc: "Sudden inability to speak properly and weakness in right hand since morning", findings: "" },
    { id: 9, age: 19, gender: "Female", specialty: "General Physician", cc: "Weakness, fatigue, and palpitations since 1 month", findings: "Pale conjunctiva" },
    { id: 10, age: 40, gender: "Male", specialty: "Pulmonologist", cc: "Chronic cough with sputum and weight loss since 2 months", findings: "" },
    { id: 11, age: 32, gender: "Female", specialty: "ENT Specialist", cc: "Severe throat pain with difficulty swallowing and fever since 3 days", findings: "Acute Tonsillitis" },
    { id: 12, age: 70, gender: "Male", specialty: "General Physician", cc: "Dizziness on standing and blurred vision", findings: "BP drop on standing" },
    { id: 13, age: 25, gender: "Male", specialty: "Dermatologist", cc: "Circular itchy patches in groin area since 2 weeks", findings: "" },
    { id: 14, age: 50, gender: "Female", specialty: "General Physician", cc: "Burning sensation while urinating with increased frequency", findings: "Urinary Tract Infection" },
    { id: 15, age: 38, gender: "Male", specialty: "Gastroenterologist", cc: "Upper abdominal burning pain worse after meals", findings: "Epigastric tenderness" },
    { id: 16, age: 16, gender: "Female", specialty: "General Physician", cc: "Headache with sensitivity to light and nausea", findings: "Migraine" },
    { id: 17, age: 58, gender: "Male", specialty: "Cardiologist", cc: "Swelling in both legs with breathlessness on lying down", findings: "" },
    { id: 18, age: 27, gender: "Female", specialty: "General Physician", cc: "Fever with chills and body ache since 3 days", findings: "Temp 102°F" },
    { id: 19, age: 44, gender: "Male", specialty: "Psychiatrist", cc: "Persistent low mood, loss of interest, poor sleep since 2 months", findings: "" },
    { id: 20, age: 6, gender: "Female", specialty: "Pediatrician", cc: "Cough with wheezing and difficulty breathing at night", findings: "" }
];

async function runTests() {
    process.stdout.write("🚀 [Tier-3 Engine] Verifying 20 OPD Cases (Elite Standard)...\n");
    
    for (const c of cases) {
        process.stdout.write(`\nEvaluating Case ${c.id}... `);
        try {
            const result = await suggestClinicalPath(c.cc, c.findings, { age: c.age, gender: c.gender, specialty: c.specialty });
            
            const primary = (result.investigations?.primary || []).join(', ') || 'None';
            const secondary = (result.investigations?.secondary || []).join(', ') || 'None';
            const meds = result.recommendations.map(r => r.drug).join(', ') || 'NONE';

            console.log(`✅ [${result.severity.toUpperCase()}]`);
            console.log(`   🔍 Diagnosis: ${result.probable_diagnosis}`);
            console.log(`   🧪 Investigations: [Essential: ${primary}] | [Optional: ${secondary}]`);
            console.log(`   💊 Medicines: ${meds}`);
            console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
        }
    }
}

runTests();
