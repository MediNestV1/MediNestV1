const { suggestClinicalPath } = require('../routes/recommendations');

const testCases = [
    // --- MIXED COMMON + SLIGHT TWISTS ---
    { id: 1, age: 26, gender: 'M', cc: 'fever, sore throat, dry cough', findings: 'duration 2 days' },
    { id: 2, age: 33, gender: 'F', cc: 'burning urination, lower abdominal pain', findings: 'duration 3 days' },
    { id: 3, age: 41, gender: 'M', cc: 'chest burning after meals, bloating', findings: 'duration 2 weeks' },
    { id: 4, age: 22, gender: 'F', cc: 'sneezing, itchy eyes, runny nose', findings: 'duration 5 days' },
    { id: 5, age: 55, gender: 'M', cc: 'cough with sputum, mild fever', findings: 'duration 4 days' },
    
    // --- DIFFERENTIATION CASES ---
    { id: 6, age: 29, gender: 'F', cc: 'headache, nausea, sensitivity to light', findings: 'duration 1 day' },
    { id: 7, age: 60, gender: 'M', cc: 'frequent urination, excessive thirst, fatigue', findings: 'duration 1 month' },
    { id: 8, age: 18, gender: 'M', cc: 'fever, rash, joint pain', findings: 'duration 3 days' },
    { id: 9, age: 47, gender: 'F', cc: 'knee pain, swelling, stiffness', findings: 'duration 2 months' },
    { id: 10, age: 35, gender: 'M', cc: 'abdominal pain, loose stools, vomiting', findings: 'duration 1 day' },
    
    // --- EDGE + RED FLAG CHECK ---
    { id: 11, age: 65, gender: 'M', cc: 'chest pain, sweating, breathlessness', findings: 'duration 1 hour' },
    { id: 12, age: 72, gender: 'F', cc: 'confusion, fever, burning urination', findings: 'duration 2 days' },
    { id: 13, age: 25, gender: 'F', cc: 'missed period, nausea, fatigue', findings: 'duration 2 weeks', is_pregnant: true },
    { id: 14, age: 50, gender: 'M', cc: 'weight loss, night sweats, chronic cough', findings: 'duration 1 month' },
    { id: 15, age: 19, gender: 'M', cc: 'severe headache, neck stiffness, fever', findings: 'duration 1 day' },
    
    // --- FINAL LOGIC BREAKERS ---
    { id: 16, age: 30, gender: 'F', cc: 'anxiety, palpitations, sweating, weight loss', findings: 'duration 3 weeks' },
    { id: 17, age: 45, gender: 'M', cc: 'lower back pain radiating to leg, numbness', findings: 'duration 1 week' },
    { id: 18, age: 52, gender: 'F', cc: 'lump in breast, no pain', findings: 'duration 3 weeks' },
    { id: 19, age: 8, gender: 'M', cc: 'wheezing, difficulty breathing at night', findings: 'duration 3 days' },
    { id: 20, age: 68, gender: 'F', cc: 'sudden vision loss in one eye', findings: 'duration 2 hours' }
];

async function runAudit() {
    console.log(`🏥 [Tier-6.0 Prescription Engine] FINAL CERTIFICATION AUDIT (20 Cases)\n`);

    for (const c of testCases) {
        process.stdout.write(`Testing Case ${c.id}... `);
        try {
            const result = await suggestClinicalPath(c.cc, c.findings, { 
                age: c.age, 
                gender: c.gender, 
                weight: c.weight || 70, 
                is_pregnant: !!c.is_pregnant 
            });
            
            console.log(`[DONE]`);
            console.log(`--- CASE ${c.id}: ${c.age}y ${c.gender} [${c.cc}] ---`);
            console.log(`Diagnosis: ${result.probable_diagnosis}`);
            console.log(`Severity: ${result.severity}`);
            console.log(`Meds Suggested:`);
            if (result.recommendations.length > 0) {
                result.recommendations.forEach(r => {
                    console.log(`- ${r.drug} [${r.class}]: ${r.dosage} | ${r.instructions}`);
                });
            } else {
                console.log(`- NONE (Referral/Safety Block)`);
            }
            console.log(`Advice: \n${result.advice}\n`);
            console.log("-------------------------------------------\n");
        } catch (e) {
            console.log(`[FAILED] Error: ${e.message}\n`);
        }
    }
}

runAudit();
