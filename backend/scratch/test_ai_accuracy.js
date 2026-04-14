const cases = [
    { id: 112, age: 65, gender: "Male", doctor: "Cardiologist", cc: "Chest pain on exertion" },
    { id: 113, age: 29, gender: "Female", doctor: "Gynecologist", cc: "Irregular menstrual cycles" },
    { id: 114, age: 52, gender: "Male", doctor: "Endocrinologist", cc: "Increased thirst and frequent urination" },
    { id: 115, age: 38, gender: "Female", doctor: "Dermatologist", cc: "Itchy red skin rash" },
    { id: 116, age: 47, gender: "Male", doctor: "Gastroenterologist", cc: "Upper abdominal pain after meals" },
    { id: 117, age: 60, gender: "Female", doctor: "Orthopedician", cc: "Knee pain while walking" },
    { id: 118, age: 25, gender: "Male", doctor: "Psychiatrist", cc: "Anxiety and panic attacks" },
    { id: 119, age: 70, gender: "Female", doctor: "Ophthalmologist", cc: "Gradual loss of vision" },
    { id: 120, age: 34, gender: "Male", doctor: "Pulmonologist", cc: "Chronic cough with sputum" },
    { id: 121, age: 55, gender: "Female", doctor: "Cardiologist", cc: "Palpitations" },
    { id: 122, age: 41, gender: "Male", doctor: "Nephrologist", cc: "Swelling in legs" },
    { id: 123, age: 19, gender: "Female", doctor: "General Physician", cc: "Fever and sore throat" },
    { id: 124, age: 63, gender: "Male", doctor: "Neurologist", cc: "Tremors in hands" },
    { id: 125, age: 48, gender: "Female", doctor: "Endocrinologist", cc: "Weight gain and fatigue" },
    { id: 126, age: 27, gender: "Male", doctor: "Dermatologist", cc: "Acne and oily skin" },
    { id: 127, age: 59, gender: "Female", doctor: "Gastroenterologist", cc: "Constipation" },
    { id: 128, age: 45, gender: "Male", doctor: "Urologist", cc: "Difficulty in urination" },
    { id: 129, age: 31, gender: "Female", doctor: "Gynecologist", cc: "Lower abdominal pain" },
    { id: 130, age: 67, gender: "Male", doctor: "Cardiologist", cc: "Shortness of breath" },
    { id: 131, age: 22, gender: "Female", doctor: "Psychiatrist", cc: "Insomnia" },
    { id: 132, age: 50, gender: "Male", doctor: "Orthopedician", cc: "Back pain" },
    { id: 133, age: 36, gender: "Female", doctor: "Dermatologist", cc: "Hair loss" },
    { id: 134, age: 58, gender: "Male", doctor: "Gastroenterologist", cc: "Acid reflux" },
    { id: 135, age: 42, gender: "Female", doctor: "Endocrinologist", cc: "Excessive sweating" },
    { id: 136, age: 73, gender: "Male", doctor: "Neurologist", cc: "Difficulty walking" },
    { id: 137, age: 28, gender: "Female", doctor: "General Physician", cc: "Headache" },
    { id: 138, age: 61, gender: "Male", doctor: "Pulmonologist", cc: "Breathlessness" },
    { id: 139, age: 49, gender: "Female", doctor: "Cardiologist", cc: "Hypertension follow-up" },
    { id: 140, age: 33, gender: "Male", doctor: "Psychiatrist", cc: "Depression symptoms" },
    { id: 141, age: 57, gender: "Female", doctor: "Nephrologist", cc: "Reduced urine output" },
    { id: 142, age: 46, gender: "Male", doctor: "Urologist", cc: "Blood in urine" },
    { id: 143, age: 24, gender: "Female", doctor: "Gynecologist", cc: "Missed periods" },
    { id: 144, age: 62, gender: "Male", doctor: "Orthopedician", cc: "Hip pain" },
    { id: 145, age: 39, gender: "Female", doctor: "Dermatologist", cc: "Skin pigmentation" },
    { id: 146, age: 53, gender: "Male", doctor: "Gastroenterologist", cc: "Loss of appetite" },
    { id: 147, age: 68, gender: "Female", doctor: "Ophthalmologist", cc: "Blurred vision" },
    { id: 148, age: 35, gender: "Male", doctor: "Pulmonologist", cc: "Wheezing" },
    { id: 149, age: 44, gender: "Female", doctor: "Cardiologist", cc: "Chest tightness" },
    { id: 150, age: 30, gender: "Male", doctor: "General Physician", cc: "Fever with chills" },
    { id: 151, age: 66, gender: "Female", doctor: "Neurologist", cc: "Memory decline" }
];

const API_URL = 'http://localhost:4001/api/recommendations/suggest';

async function runTests() {
    console.log(`Starting AI Accuracy Test for ${cases.length} cases...\n`);
    const results = [];

    for (const c of cases) {
        process.stdout.write(`Testing Case ${c.id}: ${c.cc}... `);
        try {
            const start = Date.now();
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cc: c.cc,
                    findings: '',
                    age: c.age.toString(),
                    gender: c.gender.toLowerCase(),
                    specialty: c.doctor
                })
            });

            const data = await res.json();
            const latency = Date.now() - start;

            if (data.success && data.suggestions) {
                const s = data.suggestions;
                results.push({
                    case: c.id,
                    input: `${c.age}Y ${c.gender} - ${c.cc} (${c.doctor})`,
                    diagnosis: s.probable_diagnosis || 'N/A',
                    differentials: s.differentials?.join(', ') || 'N/A',
                    recommendations: s.recommendations?.map(r => r.drug).join(', ') || 'None',
                    investigations: s.investigations?.primary?.join(', ') || 'None',
                    advice: s.advice ? s.advice.substring(0, 100) + '...' : 'N/A',
                    severity: s.severity,
                    confidence: s.confidence,
                    latency: `${latency}ms`
                });
                console.log('✅ Done');
            } else {
                results.push({
                    case: c.id,
                    input: `${c.age}Y ${c.gender} - ${c.cc} (${c.doctor})`,
                    error: data.suggestions?.error || 'Unknown Error'
                });
                console.log('❌ Error');
            }
        } catch (err) {
            results.push({
                case: c.id,
                input: `${c.age}Y ${c.gender} - ${c.cc} (${c.doctor})`,
                error: err.message
            });
            console.log('❌ Failed');
        }
        // Small delay to prevent rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\nTesting Complete. Saving results...');
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'test_results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${reportPath}`);
}

runTests();
