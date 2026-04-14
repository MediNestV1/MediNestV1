require('dotenv').config();
const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    { id: 41, age: 72, gender: "Male", specialty: "General Physician", cc: "Sudden severe headache “worst of life” with vomiting" },
    { id: 42, age: 26, gender: "Female", specialty: "Gynecologist", cc: "Lower abdominal pain with missed period and spotting" },
    { id: 43, age: 38, gender: "Male", specialty: "General Physician", cc: "Fever with productive cough and chest pain" },
    { id: 44, age: 60, gender: "Female", specialty: "Cardiologist", cc: "Breathlessness on exertion with swelling in feet" },
    { id: 45, age: 18, gender: "Male", specialty: "General Physician", cc: "High fever with severe headache and neck stiffness" },
    { id: 46, age: 49, gender: "Male", specialty: "Gastroenterologist", cc: "Persistent vomiting with inability to keep food down" },
    { id: 47, age: 30, gender: "Female", specialty: "Dermatologist", cc: "Red butterfly-shaped rash over face" },
    { id: 48, age: 65, gender: "Male", specialty: "Neurologist", cc: "Sudden loss of vision in one eye" },
    { id: 49, age: 22, gender: "Female", specialty: "General Physician", cc: "Palpitations, weight loss, excessive sweating" },
    { id: 50, age: 55, gender: "Male", specialty: "Pulmonologist", cc: "Chronic cough with blood in sputum" },
    { id: 51, age: 7, gender: "Male", specialty: "Pediatrician", cc: "Barking cough and noisy breathing at night" },
    { id: 52, age: 41, gender: "Female", specialty: "General Physician", cc: "Severe lower back pain radiating to leg" },
    { id: 53, age: 33, gender: "Male", specialty: "General Physician", cc: "Painful urination with pus discharge" },
    { id: 54, age: 58, gender: "Female", specialty: "Endocrinologist", cc: "Weight gain, cold intolerance, constipation" },
    { id: 55, age: 24, gender: "Male", specialty: "Psychiatrist", cc: "Hearing voices and suspicious behavior" },
    { id: 56, age: 67, gender: "Male", specialty: "General Physician", cc: "Sudden confusion and fever" },
    { id: 57, age: 35, gender: "Female", specialty: "General Physician", cc: "Recurrent abdominal pain with bloating" },
    { id: 58, age: 45, gender: "Male", specialty: "Cardiologist", cc: "Chest pain on exertion, relieved by rest" },
    { id: 59, age: 12, gender: "Female", specialty: "Pediatrician", cc: "Joint pain with rash and fever" },
    { id: 60, age: 50, gender: "Male", specialty: "General Physician", cc: "Yellowing of eyes and dark urine" },
    { id: 61, age: 28, gender: "Female", specialty: "Gynecologist", cc: "Severe pelvic pain with fever" },
    { id: 62, age: 63, gender: "Male", specialty: "Urologist", cc: "Difficulty passing urine with weak stream" },
    { id: 63, age: 40, gender: "Female", specialty: "General Physician", cc: "Sudden severe abdominal pain radiating to back" },
    { id: 64, age: 19, gender: "Male", specialty: "General Physician", cc: "Fever with red eyes and body rash" },
    { id: 65, age: 52, gender: "Female", specialty: "General Physician", cc: "Persistent cough worse at night" },
    { id: 66, age: 29, gender: "Female", specialty: "Dermatologist", cc: "Painful nodules in armpits" },
    { id: 67, age: 70, gender: "Male", specialty: "Neurologist", cc: "Tremors at rest and slow walking" },
    { id: 68, age: 46, gender: "Female", specialty: "General Physician", cc: "Fatigue with hair loss and weight gain" },
    { id: 69, age: 34, gender: "Male", specialty: "General Physician", cc: "Sudden swelling of lips and difficulty breathing" },
    { id: 70, age: 55, gender: "Female", specialty: "Cardiologist", cc: "Irregular heartbeat with dizziness" },
    { id: 71, age: 21, gender: "Female", specialty: "General Physician", cc: "Burning urination with no fever" },
    { id: 72, age: 65, gender: "Male", specialty: "General Physician", cc: "Progressive difficulty walking and frequent falls" },
    { id: 73, age: 31, gender: "Female", specialty: "General Physician", cc: "Severe headache with aura and nausea" },
    { id: 74, age: 48, gender: "Male", specialty: "Gastroenterologist", cc: "Difficulty swallowing liquids and solids" },
    { id: 75, age: 17, gender: "Female", specialty: "Dermatologist", cc: "Severe acne with scarring" },
    { id: 76, age: 60, gender: "Male", specialty: "General Physician", cc: "Persistent hoarseness of voice" },
    { id: 77, age: 42, gender: "Female", specialty: "General Physician", cc: "Tingling and numbness in hands and feet" },
    { id: 78, age: 25, gender: "Male", specialty: "General Physician", cc: "Sudden severe flank pain radiating to groin" },
    { id: 79, age: 53, gender: "Female", specialty: "General Physician", cc: "Chest heaviness with sweating at rest" },
    { id: 80, age: 9, gender: "Male", specialty: "Pediatrician", cc: "Fever with ear pain" },
    { id: 81, age: 36, gender: "Female", specialty: "Gynecologist", cc: "Irregular heavy menstrual bleeding" },
    { id: 82, age: 47, gender: "Male", specialty: "General Physician", cc: "Persistent fatigue with night sweats" },
    { id: 83, age: 58, gender: "Female", specialty: "General Physician", cc: "Sudden weakness in one side of body" },
    { id: 84, age: 23, gender: "Male", specialty: "General Physician", cc: "High fever after travel" },
    { id: 85, age: 66, gender: "Male", specialty: "Cardiologist", cc: "Shortness of breath at rest" },
    { id: 86, age: 39, gender: "Female", specialty: "General Physician", cc: "Abdominal pain after fatty meals" },
    { id: 87, age: 14, gender: "Male", specialty: "Pediatrician", cc: "Recurrent wheezing episodes" },
    { id: 88, age: 51, gender: "Female", specialty: "General Physician", cc: "Sudden loss of consciousness" },
    { id: 89, age: 27, gender: "Male", specialty: "General Physician", cc: "Painful swelling in scrotum" },
    { id: 90, age: 62, gender: "Female", specialty: "General Physician", cc: "Bone pain with history of fractures" }
];

async function runTests() {
    process.stdout.write("🚀 [High Volume] Running Cases 41-90...\n");
    
    for (const c of cases) {
        process.stdout.write(`Evaluating Case ${c.id}... `);
        try {
            const result = await suggestClinicalPath(c.cc, "N/A", { age: c.age, gender: c.gender, specialty: c.specialty });
            const primary = (result.investigations?.primary || []).join(', ') || 'None';
            const meds = result.recommendations.map(r => r.drug).join(', ') || 'NONE';
            console.log(`✅ **Case ${c.id}**: 🔍 Diagnosis: ${result.probable_diagnosis} ⚖️ Differentials: ${result.differentials.join(', ')} 🧪 Investigations: ${primary} 💊 Medicines: ${meds} 📝 Advice: ${result.advice.replace(/\n•/g, ' |').substring(0, 100)}... 🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
        }
    }
}

runTests();
