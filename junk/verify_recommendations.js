require('dotenv').config();
// No need to require node-fetch, using global fetch

const API_URL = 'http://localhost:4001/api/recommendations/suggest';

async function testRecommendation(symptoms, age, gender, specialty = 'General Practitioner') {
    console.log(`\n🧪 Testing: "${symptoms}" | Age: ${age} | Gender: ${gender} | Speciality: ${specialty}`);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cc: symptoms, findings: '', age, gender, specialty })
        });
        const data = await res.json();
        
        if (data.success && data.suggestions) {
            console.log('✅ Success!');
            const { recommendations, advice, warnings } = data.suggestions;
            
            if (warnings && warnings.length > 0) {
                console.log('⚠️ WARNINGS:', warnings.join(' | '));
            }
            
            recommendations.forEach(rec => {
                console.log(`🏥 DRUG: ${rec.drug} | 💡 ${rec.reason}`);
                console.log(`📦 BRANDS: ${rec.brands.map(b => b.name).join(', ')}`);
            });
        }
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    }
}

async function runTests() {
    // Case 1: Pediatric
    await testRecommendation("Fever", 5, "male", "Pediatrician");
    // Case 2: Female Safe Mode
    await testRecommendation("Headache and Body ache", 28, "female", "General Practitioner");
}

runTests();
