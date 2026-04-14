require('dotenv').config();
const { suggestClinicalPath } = require('./recommendations_test_logic'); // I'll mock the requirements

async function test() {
    console.log("Testing Case: Fever");
    const result = await suggestClinicalPath("Patient has high fever 102F and body ache", "Temp 102F", { age: 30, gender: "male", specialty: "GP" });
    console.log(JSON.stringify(result, null, 2));
}

// Manually extract the function for testing
// I will just copy the function into a new file for a quick run
