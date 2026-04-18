const { suggestClinicalPath } = require('../routes/recommendations');

const cases = [
    { id: 1, age: 29, gender: 'M', cc: "diarrhea, vomiting, dehydration", findings: "Moderate dehydration", specialty: "GP", duration: "2 days" },
    { id: 2, age: 34, gender: 'F', cc: "fatigue, hair loss, weakness", findings: "Pallor noted", specialty: "GP", duration: "2 months" },
    { id: 3, age: 26, gender: 'F', cc: "missed period, vomiting", findings: "Stable vitals", specialty: "GP", is_pregnant: true, duration: "1 week" },
    { id: 4, age: 62, gender: 'M', cc: "chest pain, sweating, breathlessness", findings: "Acute distress", specialty: "GP", duration: "1 hour" },
    { id: 5, age: 40, gender: 'M', cc: "acidity, bloating", findings: "Epigastric tenderness", specialty: "GP", duration: "10 days" },
    { id: 6, age: 31, gender: 'F', cc: "dry cough", findings: "Normal breath sounds", specialty: "GP", duration: "5 days" },
    { id: 7, age: 55, gender: 'F', cc: "knee pain, long-term painkiller use, acidity", findings: "Known OA case", specialty: "GP", duration: "3 months" },
    { id: 8, age: 23, gender: 'M', cc: "fever, rash, joint pain", findings: "High fever", specialty: "GP", duration: "3 days" },
    { id: 9, age: 38, gender: 'F', cc: "fungal skin infection, itching", findings: "Ring-shaped lesions", specialty: "GP", duration: "1 week" },
    { id: 10, age: 45, gender: 'M', cc: "burning chest after meals", findings: "Stable", specialty: "GP", duration: "2 weeks" }
];

async function runCertification() {
    console.log("🏥 [TIER-7.3 CERTIFICATION] FINAL 10 CASES\n");
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

runCertification().catch(err => console.error(err));
