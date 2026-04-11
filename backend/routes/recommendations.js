const express = require('express');
const router = express.Router();
const { validatePrescription } = require('../lib/clinicalVault');

// Helper: AI Clinical Suggestion Logic
async function suggestClinicalPath(cc, findings) {
  const prompt = `You are a clinical-grade medical assistant. Provide a suggested treatment path for the following case.
  
  Symptoms: ${cc}
  Diagnosis: ${findings}
  
  CRITICAL:
  1. Suggest standard medicines (MAX 5 initially) with doses, frequencies, and durations.
  2. Provide patient-facing "Clinical Advice" in 2-3 concise sentences.
  3. RETURN ONLY VALID JSON.
  
  OUTPUT FORMAT:
  {
    "suggestedMeds": [ 
       { "name": "Med Name", "type": "Tab/Syp/...", "dose": "500mg", "freq": "1-0-1", "duration": "5 days", "instructions": "After food" } 
    ],
    "suggestedAdvice": "Your advice text here."
  }`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || '{}';
    
    // Cleanup AI artifacts
    if (result.includes('```json')) {
      result = result.split('```json')[1].split('```')[0].trim();
    } else if (result.includes('```')) {
      result = result.split('```')[1].split('```')[0].trim();
    }
    
    const parsed = JSON.parse(result);
    
    // 🔥 SECOND TIER: HARD RULES VALIDATION
    if (parsed.suggestedMeds) {
      const { validMeds, flags } = validatePrescription(parsed.suggestedMeds);
      parsed.suggestedMeds = validMeds;
      parsed.validationFlags = flags;
    }
    
    return parsed;
  } catch (err) {
    console.error('❌ [AI ERROR] Clinical Suggestion:', err.message);
    return { error: "Suggestion service unavailable" };
  }
}

router.post('/suggest', async (req, res) => {
  const { cc, findings } = req.body;
  
  console.log(`🤖 [AI] Suggesting treatment path for: ${cc} | ${findings}`);
  const suggestions = await suggestClinicalPath(cc, findings);
  res.json({ success: true, suggestions });
});

module.exports = router;
