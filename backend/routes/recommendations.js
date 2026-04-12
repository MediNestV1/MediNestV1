const express = require('express');
const router = express.Router();
const { validatePrescription } = require('../lib/clinicalVault');

// Helper: AI Clinical Suggestion Logic
async function suggestClinicalPath(cc, findings) {
  const prompt = `You are a clinical-grade medical decision support system. 
  Provide a suggested treatment path for the following case.
  
  Symptoms: ${cc}
  Diagnosis: ${findings}
  
  CRITICAL REASONING STEPS:
  1. Determine the "clinicalIntent" (The primary goal, e.g., "Clear Infection", "Symptom Control").
  2. Determine the "diseaseStage" (e.g., "Early/Mild", "Active/Acute", "Recovery").
  3. Organize medicines into three tiers:
     - "CORE": Essential drugs for the primary intent.
     - "SUPPORTIVE": Secondary drugs for secondary symptoms.
     - "OPTIONAL": Consider only if needed.
  4. Assign each drug a "functionalGroup" string from this list [GI_UP, GI_DOWN, GI_SOFT, PAIN, INFLAMMATION, ACID_CONTROL, INFECTION, LOCAL_CARE, OTHER].
  
  RULES:
  - DO NOT prescribe opposite mechanisms (e.g., laxative + anti-diarrheal).
  - DO NOT over-prescribe. One drug per functional group.
  - No "defensive" prescribing for symptoms not present.
  
  OUTPUT FORMAT (STRICT JSON ONLY):
  {
    "clinicalIntent": "...",
    "diseaseStage": "...",
    "suggestedMeds": [ 
       { "name": "...", "type": "...", "dose": "...", "freq": "...", "duration": "...", "instructions": "...", "tier": "CORE/SUPPORTIVE/OPTIONAL", "functionalGroup": "..." } 
    ],
    "suggestedAdvice": "Concise advice text."
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
    
    // 🔥 SECOND TIER: PATTERN-AWARE VALIDATION
    if (parsed.suggestedMeds) {
      const { validMeds, flags } = validatePrescription(parsed.suggestedMeds);
      parsed.suggestedMeds = validMeds;
      parsed.validationFlags = flags;
    }
    
    return parsed;
  } catch (err) {
    console.error('❌ [AI ERROR] Clinical Decision Support:', err.message);
    return { error: "Decision service unavailable" };
  }
}

router.post('/suggest', async (req, res) => {
  const { cc, findings } = req.body;
  
  console.log(`🤖 [AI] Suggesting treatment path for: ${cc} | ${findings}`);
  const suggestions = await suggestClinicalPath(cc, findings);
  res.json({ success: true, suggestions });
});

module.exports = router;
