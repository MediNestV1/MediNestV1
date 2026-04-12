const express = require('express');
const router = express.Router();
const { validatePrescription } = require('../lib/clinicalVault');

// Helper: AI Clinical Suggestion Logic
async function suggestClinicalPath(cc, findings) {
  const prompt = `Persona: You are a professional medical decision support system assisting a doctor.
  
  TASK:
  1. ANALYZE the symptoms and findings provided below.
  2. IDENTIFY the most probable diagnosis.
  3. SUGGEST exactly 1 or 2 clinically relevant medicines for THAT diagnosis only.
  4. PROVIDE a clinical reason for each medicine (Why is it being prescribed?).
  5. LIMIT suggests: 1 CORE medicine (treats cause) and max 1 SUPPORTIVE medicine (treats symptoms).
  6. FORMATTING RULES:
     - "freq": MUST use standard patterns: 1-0-0, 0-0-1, 1-0-1, 1-1-1, or SOS.
     - "instructions": MUST use: 'After Meal', 'Before Meal', or 'Empty Stomach' if applicable.
  7. GENERATE patient-friendly, diagnosis-specific advice (not generic templates).

  CASE DATA:
  Symptoms: ${cc}
  Current Findings: ${findings}
  
  STRICT RULES:
  - Do NOT mix treatments for different conditions.
  - Do NOT provide more than 2 medicines.
  - Do NOT use generic advice like "Rest well" unless it's specifically relevant to the severity.
  - Respond ONLY with VALID JSON.

  JSON STRUCTURE:
  {
    "probableDiagnosis": "The identified primary diagnosis",
    "clinicalIntent": "Main objective (e.g., Clear Infection, Rehydration)",
    "diseaseStage": "Status (e.g., Acute, Sub-acute)",
    "suggestedMeds": [ 
       { 
         "name": "...", 
         "type": "Tab/Syp/Cap", 
         "dose": "...", 
         "freq": "...", 
         "duration": "...", 
         "instructions": "...", 
         "tier": "CORE/SUPPORTIVE", 
         "reason": "Clear medical reason for the doctor" 
       } 
    ],
    "suggestedAdvice": "Specific clinical advice for this condition."
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
