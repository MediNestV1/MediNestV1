const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    { id: 1, age: 42, gender: 'M', cc: "fever, cough with sputum, breathlessness", findings: "Dullness on percussion", specialty: "GP", duration: "3 days" },
    { id: 2, age: 27, gender: 'F', cc: "missed period, lower abdominal pain, dizziness", findings: "Tender abdomen", specialty: "GP", is_pregnant: true, duration: "5 days" },
    { id: 3, age: 60, gender: 'M', cc: "burning urination, fever, flank pain", findings: "CVA tenderness", specialty: "GP", duration: "2 days" },
    { id: 4, age: 19, gender: 'M', cc: "headache, vomiting, neck stiffness", findings: "Positive Brudzinski sign", specialty: "GP", duration: "1 day" },
    { id: 5, age: 35, gender: 'F', cc: "itching, red circular rash on skin", findings: "Clear center", specialty: "GP", duration: "1 week" },
    { id: 6, age: 50, gender: 'M', cc: "chest pain after meals, sour taste", findings: "Normal ECG", specialty: "GP", duration: "2 weeks" },
    { id: 7, age: 25, gender: 'F', cc: "anxiety, palpitations, sweating", findings: "Tachycardia", specialty: "GP", duration: "3 weeks" },
    { id: 8, age: 68, gender: 'F', cc: "sudden weakness of one side of body", findings: "Facial droop", specialty: "GP", duration: "2 hours" },
    { id: 9, age: 33, gender: 'M', cc: "loose motions, dehydration, weakness", findings: "Sunken eyes", specialty: "GP", duration: "2 days" },
    { id: 10, age: 48, gender: 'F', cc: "fatigue, pallor, breathlessness on exertion", findings: "Nail beds pale", specialty: "GP", duration: "1 month" }
];

async function runChaos() {
    console.log("🏥 [TIER-7.5 CHAOS SIMULATION] FINAL 10 CASES\n");
    for (const c of cases) {
        process.stdout.write(`Testing Case ${c.id}... `);
        const res = await suggestClinicalPath(c.cc, c.findings, c);
        console.log("[DONE]");
        console.log(`--- CASE ${c.id}: ${c.age}y ${c.gender} [${c.cc}] ---`);
        console.log(`Diagnosis: ${res.probable_diagnosis}`);
        console.log(`Severity: ${res.severity}`);
        console.log(`Meds Suggested:`);
        if (res.recommendations.length === 0) {
            console.log(`- NONE (Emergency/Firewall/Safety Block)`);
        } else {
            res.recommendations.forEach(r => {
                console.log(`- ${r.drug} [${r.class}]: ${r.dosage}`);
            });
        }
        console.log(`Advice: \n${res.advice}`);
        console.log(`-------------------------------------------\n`);
    }
}

runChaos().catch(err => console.error(err));
