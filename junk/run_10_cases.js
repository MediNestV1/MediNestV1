require('dotenv').config();
const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    {
        name: "Case 1: Cardio Emergency",
        cc: "Severe crushing chest pain radiating to left arm with excessive sweating since 30 mins."
    },
    {
        name: "Case 2: Neuro Emergency",
        cc: "Sudden weakness in right hand and difficulty speaking since 1 hour."
    },
    {
        name: "Case 3: Moderate Gastro",
        cc: "Frequent watery diarrhea (10+ episodes) with high fever and severe fatigue."
    },
    {
        name: "Case 4: Symptomatic Resp",
        cc: "Dry cough and running nose with mild throat pain since 2 days."
    },
    {
        name: "Case 5: Uncertain Dizziness",
        cc: "Chronic fatigue and occasional dizziness when standing up quickly."
    },
    {
        name: "Case 6: Local Derm",
        cc: "Intensely itchy red circular patches between thighs and armpits since 1 week."
    },
    {
        name: "Case 7: Functional Stress",
        cc: "Feeling mildly stressed and having occasional difficulty sleeping due to work."
    },
    {
        name: "Case 8: Local Procto",
        cc: "Painful swelling during bowel movements with occasional bright red blood spotting."
    },
    {
        name: "Case 9: Hypoxia Emergency",
        cc: "Difficulty breathing at rest with bluish tint on fingernails; SpO2 is 89%."
    },
    {
        name: "Case 10: Acute Fever",
        cc: "High fever (101F), severe body ache, and headache since last night."
    }
];

async function runTests() {
    console.log("🚀 [MediNest AI] Running Production Verification Suite (10 Cases)\n");
    
    for (const c of cases) {
        process.stdout.write(`Evaluating ${c.name}... `);
        try {
            const result = await suggestClinicalPath(c.cc, "N/A", { age: 45, gender: "Male", specialty: "General Doctor" });
            console.log("✅");
            console.log(`   🔍 Diagnosis: ${result.probable_diagnosis}`);
            console.log(`   ⚖️ Differentials: ${result.differentials.join(', ')}`);
            console.log(`   🧪 Investigations: ${result.investigations.join(', ')}`);
            console.log(`   💊 Medicines: ${result.recommendations.map(r => r.drug).join(', ') || 'NONE'}`);
            console.log(`   📝 Advice: ${result.advice.replace(/\n•/g, ' |')}`);
            console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%\n`);
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}\n`);
        }
    }
}

runTests();
