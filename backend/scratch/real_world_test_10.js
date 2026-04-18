const { suggestClinicalPath } = require('../routes/recommendations');

const testCases = [
    { id: 1, age: 24, gender: 'M', weight: 70, cc: 'fever, body ache, headache', findings: 'Temp 102F, duration 2 days' },
    { id: 2, age: 1.5, gender: 'F', weight: 10, cc: 'runny nose, sneezing, mild cough', findings: 'Clear nasal discharge, duration 3 days' }, // Infant test
    { id: 3, age: 45, gender: 'M', weight: 82, cc: 'acidity, burning chest, sour belching', findings: 'Epigastric tenderness, duration 1 week' },
    { id: 4, age: 19, gender: 'F', weight: 55, is_pregnant: true, cc: 'sore throat, fever, difficulty swallowing', findings: 'Congested tonsils, duration 2 days' }, // Pregnancy test
    { id: 5, age: 35, gender: 'M', weight: 75, cc: 'dry cough, throat irritation, no fever', findings: 'Clear chest on auscultation, duration 5 days' },
    { id: 6, age: 50, gender: 'F', weight: 68, cc: 'joint pain, stiffness in morning, fatigue', findings: 'Bilateral small joint swelling, duration 2 months' },
    { id: 7, age: 28, gender: 'M', weight: 72, cc: 'loose motions, abdominal cramps, dehydration', findings: 'Hyperactive bowel sounds, duration 1 day' },
    { id: 8, age: 60, gender: 'F', weight: 65, cc: 'frequent urination, burning urination, mild fever', findings: 'Suprapubic tenderness, duration 3 days' },
    { id: 9, age: 22, gender: 'F', weight: 60, cc: 'acne, irregular periods, weight gain', findings: 'Facial acne, hirsutism, duration 6 months' },
    { id: 10, age: 40, gender: 'M', weight: 80, cc: 'Chest pain radiating to jaw', findings: 'Sweating, duration 30 mins' } // Red Flag test
];

async function runTest() {
    console.log(`🏥 [Tier-6.0 Prescription Engine] Real-World Audit (10 Cases)\n`);

    for (const c of testCases) {
        console.log(`--- CASE ${c.id}: ${c.age}y ${c.gender} [${c.cc}] ---`);
        try {
            const result = await suggestClinicalPath(c.cc, c.findings, { 
                age: c.age, 
                gender: c.gender, 
                weight: c.weight, 
                is_pregnant: !!c.is_pregnant 
            });
            
            console.log(`Diagnosis: ${result.probable_diagnosis}`);
            console.log(`Severity: ${result.severity}`);
            console.log(`Meds Suggested:`);
            result.recommendations.forEach(r => {
                console.log(`- ${r.drug} [${r.class}]: ${r.dosage} | ${r.instructions}`);
            });
            console.log(`Advice: \n${result.advice}\n`);
        } catch (e) {
            console.log(`Error: ${e.message}\n`);
        }
    }
}

runTest();
