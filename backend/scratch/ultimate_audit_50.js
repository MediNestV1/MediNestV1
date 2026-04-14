const { suggestClinicalPath } = require('../routes/recommendations');

const ultimateCases = [
    // --- SECTION 1: HIGH-FREQUENCY OPD ---
    { id: 1, age: 25, gender: 'M', cc: 'fever, chills, headache', findings: 'duration 2 days' },
    { id: 2, age: 32, gender: 'F', cc: 'cough, sneezing, itchy eyes', findings: 'duration 4 days' },
    { id: 3, age: 40, gender: 'M', cc: 'acidity, bloating after meals', findings: 'duration 1 week' },
    { id: 4, age: 18, gender: 'F', cc: 'sore throat, fever, pain swallowing', findings: 'duration 2 days' },
    { id: 5, age: 28, gender: 'M', cc: 'dry cough, no fever', findings: 'duration 5 days' },
    { id: 6, age: 52, gender: 'F', cc: 'knee pain, stiffness morning', findings: 'duration 3 months' },
    { id: 7, age: 30, gender: 'M', cc: 'diarrhea, cramps', findings: 'duration 1 day' },
    { id: 8, age: 65, gender: 'F', cc: 'burning urination, fever', findings: 'duration 3 days' },
    { id: 9, age: 21, gender: 'F', cc: 'acne, irregular periods', findings: 'duration 6 months' },
    { id: 10, age: 38, gender: 'M', cc: 'lower back pain after sitting', findings: 'duration 1 week' },

    // --- SECTION 2: DIFFERENTIAL + TRAPS ---
    { id: 11, age: 29, gender: 'F', cc: 'fever, rash, joint pain', findings: 'duration 3 days' },
    { id: 12, age: 45, gender: 'M', cc: 'chest pain after food, sour taste', findings: 'no sweating' },
    { id: 13, age: 19, gender: 'M', cc: 'fever + lymph nodes', findings: 'duration 4 days' },
    { id: 14, age: 60, gender: 'F', cc: 'cough + weight loss', findings: 'duration 1 month' },
    { id: 15, age: 33, gender: 'F', cc: 'missed period + nausea', findings: 'duration 1 week', is_pregnant: true },
    { id: 16, age: 27, gender: 'M', cc: 'vomiting + dehydration', findings: 'duration 2 days' },
    { id: 17, age: 50, gender: 'F', cc: 'joint pain + acidity', findings: 'long-term NSAID use' },
    { id: 18, age: 31, gender: 'M', cc: 'cough + wheezing', findings: 'duration 3 days' },
    { id: 19, age: 70, gender: 'F', cc: 'confusion + fever', findings: 'duration 2 days' },
    { id: 20, age: 22, gender: 'F', cc: 'anxiety + tremor + weight loss', findings: 'duration 1 month' },

    // --- SECTION 3: RED FLAG DETECTION ---
    { id: 21, age: 65, gender: 'M', cc: 'chest pain + sweating', findings: 'duration 1 hour' },
    { id: 22, age: 72, gender: 'F', cc: 'sudden weakness one side', findings: 'duration 1 hour' },
    { id: 23, age: 19, gender: 'M', cc: 'fever + neck stiffness', findings: 'duration 1 day' },
    { id: 24, age: 50, gender: 'M', cc: 'weight loss + night sweats + cough', findings: 'duration 1 month' },
    { id: 25, age: 8, gender: 'M', cc: 'fever + rash + red eyes', findings: 'duration 3 days' },
    { id: 26, age: 40, gender: 'M', cc: 'severe headache + vomiting', findings: 'duration 1 day' },
    { id: 27, age: 35, gender: 'F', cc: 'abdominal pain + missed period + dizziness', findings: 'duration 1 day' },
    { id: 28, age: 68, gender: 'F', cc: 'sudden vision loss', findings: 'duration 2 hours' },
    { id: 29, age: 55, gender: 'M', cc: 'black stools + weakness', findings: 'duration 2 days' },
    { id: 30, age: 10, gender: 'F', cc: 'abdominal pain + vomiting + fever', findings: 'duration 1 day' },

    // --- SECTION 4: COMPLEX MULTI-SYSTEM ---
    { id: 31, age: 48, gender: 'M', cc: 'diabetes + foot wound + fever', findings: 'duration 1 week' },
    { id: 32, age: 29, gender: 'F', cc: 'vomiting + pregnancy + dehydration', findings: 'duration 3 days', is_pregnant: true },
    { id: 33, age: 55, gender: 'M', cc: 'chest pain + cough + fever', findings: 'duration 3 days' },
    { id: 34, age: 34, gender: 'F', cc: 'hair loss + fatigue + weight gain', findings: 'duration 2 months' },
    { id: 35, age: 45, gender: 'M', cc: 'back pain radiating leg', findings: 'duration 1 week' },
    { id: 36, age: 60, gender: 'F', cc: 'hypertension + headache + dizziness', findings: 'duration 2 days' },
    { id: 37, age: 52, gender: 'M', cc: 'alcohol use + abdominal pain', findings: 'sudden onset' },
    { id: 38, age: 41, gender: 'F', cc: 'palpitations + sweating + anxiety', findings: 'duration 1 week' },
    { id: 39, age: 67, gender: 'M', cc: 'urinary retention + weak stream', findings: 'duration 1 month' },
    { id: 40, age: 36, gender: 'F', cc: 'fatigue + pallor + breathlessness', findings: 'duration 1 month' },

    // --- SECTION 5: CONTRAINDICATION TESTS ---
    { id: 41, age: 30, gender: 'M', cc: 'diarrhea + dehydration + wants pain relief', findings: 'duration 2 days' },
    { id: 42, age: 50, gender: 'F', cc: 'acidity + long-term NSAID', findings: 'burning upper abdomen' },
    { id: 43, age: 28, gender: 'F', cc: 'pregnancy + cough', findings: 'duration 4 days', is_pregnant: true },
    { id: 44, age: 65, gender: 'M', cc: 'kidney disease + UTI', findings: 'mild fever' },
    { id: 45, age: 22, gender: 'M', cc: 'asthma + cold', findings: 'duration 2 days' },
    { id: 46, age: 40, gender: 'F', cc: 'diabetes + fungal infection', findings: 'duration 1 week' },
    { id: 47, age: 70, gender: 'M', cc: 'heart disease + pain', findings: 'chronic knee pain' },
    { id: 48, age: 19, gender: 'F', cc: 'anemia + fatigue', findings: 'breathless on exertion' },
    { id: 49, age: 8, gender: 'F', cc: 'fever + vomiting', findings: 'duration 1 day' },
    { id: 50, age: 55, gender: 'F', cc: 'thyroid disorder + palpitations', findings: 'shaky hands' }
];

async function runAudit() {
    console.log(`🏥 [Tier-6.5 Prescription Engine] ULTIMATE CERTIFICATION AUDIT (50 Cases)\n`);

    for (const c of ultimateCases) {
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
            if (result.recommendations && result.recommendations.length > 0) {
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
