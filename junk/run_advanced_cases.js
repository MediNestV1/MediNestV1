require('dotenv').config();
const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    { id: 21, age: 62, gender: "Male", specialty: "General Physician", cc: "Gradual swelling in legs with reduced urine output since 1 week", findings: "BP 160/100" },
    { id: 22, age: 28, gender: "Female", specialty: "Gynecologist", cc: "Missed periods for 2 months with nausea and breast tenderness", findings: "" },
    { id: 23, age: 45, gender: "Male", specialty: "Gastroenterologist", cc: "Black-colored stools with weakness since 3 days", findings: "" },
    { id: 24, age: 34, gender: "Female", specialty: "General Physician", cc: "Fever with severe joint pain and rash since 4 days", findings: "" },
    { id: 25, age: 50, gender: "Male", specialty: "Neurologist", cc: "Progressive tremors in hands with slowness in movements", findings: "" },
    { id: 26, age: 22, gender: "Male", specialty: "Dermatologist", cc: "Painful acne with pus-filled lesions over face and back", findings: "" },
    { id: 27, age: 65, gender: "Female", specialty: "Ophthalmologist", cc: "Gradual painless loss of vision in both eyes", findings: "" },
    { id: 28, age: 31, gender: "Female", specialty: "General Physician", cc: "Sudden onset breathlessness after long travel", findings: "" },
    { id: 29, age: 14, gender: "Male", specialty: "Pediatrician", cc: "Fever with sore throat and white patches on tonsils", findings: "" },
    { id: 30, age: 48, gender: "Female", specialty: "Endocrinologist", cc: "Increased thirst, frequent urination, and weight loss", findings: "" },
    { id: 31, age: 36, gender: "Male", specialty: "General Physician", cc: "Burning sensation in chest after meals, worse at night", findings: "" },
    { id: 32, age: 58, gender: "Female", specialty: "Cardiologist", cc: "Sudden palpitations with dizziness", findings: "" },
    { id: 33, age: 26, gender: "Female", specialty: "Dermatologist", cc: "Hair loss with patchy bald areas", findings: "" },
    { id: 34, age: 40, gender: "Male", specialty: "General Physician", cc: "High fever with chills and sweating episodes every evening", findings: "" },
    { id: 35, age: 52, gender: "Male", specialty: "Gastroenterologist", cc: "Difficulty swallowing solid food, gradually worsening", findings: "" },
    { id: 36, age: 19, gender: "Female", specialty: "Psychiatrist", cc: "Sudden episodes of fear, palpitations, and sweating", findings: "" },
    { id: 37, age: 67, gender: "Male", specialty: "General Physician", cc: "Memory loss and confusion over last 6 months", findings: "" },
    { id: 38, age: 30, gender: "Female", specialty: "General Physician", cc: "Painful urination with lower abdominal pain and fever", findings: "" },
    { id: 39, age: 55, gender: "Male", specialty: "Pulmonologist", cc: "Shortness of breath with chronic smoking history", findings: "" },
    { id: 40, age: 7, gender: "Female", specialty: "Pediatrician", cc: "Itchy rash with small blisters over body and mild fever", findings: "" }
];

async function runTests() {
    console.log("🚀 [Advanced Engine] Running Cases 21-40...\n");
    
    for (const c of cases) {
        process.stdout.write(`Evaluating Case ${c.id}... `);
        try {
            const result = await suggestClinicalPath(c.cc, c.findings, { age: c.age, gender: c.gender, specialty: c.specialty });
            
            const primary = (result.investigations?.primary || []).join(', ') || 'None';
            const meds = result.recommendations.map(r => r.drug).join(', ') || 'NONE';
            const advice = result.advice.replace(/\n•/g, ' |').substring(0, 200);

            console.log(`✅ **Case ${c.id} (${c.specialty})**: 🔍 Diagnosis: ${result.probable_diagnosis} ⚖️ Differentials: ${result.differentials.join(', ') || 'None'} 🧪 Investigations: ${primary} 💊 Medicines: ${meds} 📝 Advice: ${advice} 🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
        }
    }
}

runTests();
