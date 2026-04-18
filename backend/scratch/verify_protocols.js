const { suggestClinicalPath } = require('../routes/recommendations');

async function testProtocols() {
    console.log('🧪 [Tier-5.8 Protocol Engine Verification]\n');

    // Test 1: URTI Augmentation
    console.log('--- Test 1: URTI Augmentation ---');
    const urti = await suggestClinicalPath("Sever cough, fever, runny nose", "Temp 101F, clear congestion", { age: 30, gender: 'M' });
    console.log('Dx:', urti.probable_diagnosis);
    console.log('Meds:', urti.recommendations.map(m => m.drug).join(', '));
    // Expected: paracetamol, cetirizine, dextromethorphan/codeine

    // Test 2: Dengue NSAID Block
    console.log('\n--- Test 2: Dengue NSAID Block ---');
    // We pass 'nsaid' in findings to see if the protocol strips it
    const dengue = await suggestClinicalPath("High fever, bone pain, rash", "Suspected Dengue. Patient took Aspirin.", { age: 40, gender: 'F' });
    console.log('Dx:', dengue.probable_diagnosis);
    const meds = dengue.recommendations.map(m => m.drug.toLowerCase());
    console.log('Meds:', meds.join(', '));
    const hasNsaid = meds.some(m => m.includes('aceclofenac') || m.includes('diclofenac') || m.includes('aspirin'));
    console.log('NSAID Correctly Blocked:', !hasNsaid);

    // Test 3: Gastritis Augmentation
    console.log('\n--- Test 3: Gastritis Augmentation ---');
    const gast = await suggestClinicalPath("Severe burning in stomach", "Chronic gastritis signs", { age: 50, gender: 'M' });
    console.log('Dx:', gast.probable_diagnosis);
    console.log('Meds:', gast.recommendations.map(m => m.drug).join(', '));
    // Expected: pantoprazole, magnesium hydroxide (antacid)
}

testProtocols();
