const { suggestClinicalPath } = require('../routes/recommendations');

async function testCurrent() {
    const cc = "Severe stomach burning and acidity";
    const findings = "Epigastric tenderness";
    try {
        const result = await suggestClinicalPath(cc, findings, { age: 25, gender: 'M' });
        console.log('--- Clinical Path Result ---');
        console.log('Dx:', result.probable_diagnosis);
        console.log('Severity:', result.severity);
        console.log('Recommendations Object:', JSON.stringify(result.recommendations, null, 2));
        console.log('Meds Suggested:', result.recommendations.map(m => m.drug).join(', '));
        console.log('AI Logic Advice:\n', result.advice);
    } catch (e) {
        console.error('Error:', e);
    }
}

testCurrent();
