const { suggestClinicalPath } = require('../routes/recommendations');

const bossCases = [
    // --- MIXED + OVERLAPPING SYMPTOMS ---
    { id: 1, age: 27, gender: 'F', cc: 'fever, burning urination, lower back pain', findings: 'duration 2 days' },
    { id: 2, age: 38, gender: 'M', cc: 'chest pain after meals, sour taste, no sweating', findings: 'duration 1 week' },
    { id: 3, age: 19, gender: 'M', cc: 'fever, sore throat, swollen lymph nodes', findings: 'duration 4 days' },
    { id: 4, age: 60, gender: 'F', cc: 'cough, weight loss, mild fever', findings: 'duration 1 month' },
    { id: 5, age: 32, gender: 'F', cc: 'missed period, abdominal pain, dizziness', findings: 'duration 1 week' },
    
    // --- CONTRADICTION CASES ---
    { id: 6, age: 25, gender: 'M', cc: 'diarrhea, dehydration, severe weakness', findings: 'duration 2 days' },
    { id: 7, age: 45, gender: 'F', cc: 'knee pain, acidity, long-term painkiller use', findings: 'duration 3 months' },
    { id: 8, age: 30, gender: 'M', cc: 'cough, wheezing, allergy history', findings: 'duration 3 days' },
    { id: 9, age: 70, gender: 'F', cc: 'confusion, fever, cough', findings: 'duration 2 days' },
    { id: 10, age: 22, gender: 'F', cc: 'anxiety, palpitations, tremor, weight loss', findings: 'duration 1 month' },
    
    // --- DIAGNOSTIC TRAPS ---
    { id: 11, age: 35, gender: 'M', cc: 'headache, vomiting, blurred vision', findings: 'duration 2 days' },
    { id: 12, age: 50, gender: 'F', cc: 'abdominal pain, bloating, weight loss', findings: 'duration 1 month' },
    { id: 13, age: 8, gender: 'M', cc: 'fever, rash, red eyes', findings: 'duration 3 days' },
    { id: 14, age: 40, gender: 'M', cc: 'severe back pain, fever', findings: 'duration 2 days' },
    { id: 15, age: 65, gender: 'F', cc: 'sudden weakness on one side', findings: 'duration 1 hour' },
    
    // --- COMPLEX MULTI-SYSTEM ---
    { id: 16, age: 48, gender: 'M', cc: 'diabetes, foot wound, fever', findings: 'duration 1 week' },
    { id: 17, age: 29, gender: 'F', cc: 'vomiting, missed period, dehydration', findings: 'duration 3 days' },
    { id: 18, age: 55, gender: 'M', cc: 'chest pain, cough, fever', findings: 'duration 3 days' },
    { id: 19, age: 34, gender: 'F', cc: 'hair loss, weight gain, fatigue', findings: 'duration 2 months' },
    { id: 20, age: 10, gender: 'F', cc: 'abdominal pain, vomiting, fever', findings: 'duration 1 day' }
];

async function runAudit() {
    console.log(`🏥 [Tier-6.5 Prescription Engine] BOSS-LEVEL STRESS TEST (20 Cases)\n`);

    for (const c of bossCases) {
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
                console.log(`- NONE (Emergency/Firewall/Safety Block)`);
            }
            console.log(`Advice: \n${result.advice}\n`);
            console.log("-------------------------------------------\n");
        } catch (e) {
            console.log(`[FAILED] Error: ${e.message}\n`);
        }
    }
}

runAudit();
