const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// Helper: AI Clinical Audit Logic
async function analyzeClinicalPrescription(cc, findings, meds) {
  const prompt = `You are a clinical-grade medical assistant. Your task is to analyze prescriptions with strict safety and medical logic.

RULES (NON-NEGOTIABLE):
1. DO NOT hallucinate medicines, doses, or durations.
2. ONLY analyze medicines explicitly provided in the input.
3. DO NOT suggest new medicines unless clearly necessary — and mark them as "optional suggestion".
4. NEVER override or modify prescribed doses unless they are unsafe — if unsafe, explicitly flag as "POTENTIAL ERROR".
5. STRICTLY check for:
   * Drug duplication
   * Drug interactions
   * Contradictory mechanisms (e.g., laxative + anti-diarrheal)
   * Incorrect duration or dosing
6. If any contradiction exists, clearly label: → "LOGICAL ERROR IN PRESCRIPTION"
7. DO NOT assume diagnosis — infer cautiously from symptoms only.
8. Mark each medicine as: "Essential", "Supportive", "Questionable", or "Unnecessary".
9. Provide reasoning in 1–2 lines MAX per medicine.
10. If evidence is weak (e.g., herbal/ayurvedic), explicitly say: → "Limited clinical evidence"

INPUT DATA:
- Symptoms (Chief Complaints): ${cc}
- Diagnosis (Findings): ${findings}
- Current Medicines: ${meds && meds.length > 0 ? JSON.stringify(meds.map(m => ({
    name: m.name,
    type: m.type,
    dose: m.dose,
    freq: m.freq,
    duration: m.duration,
    instructions: m.instructions
  }))) : "NONE (Provide initial treatment priority instead)"}

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "section1": [ { "name": "Med Name", "classification": "Essential/Supportive/...", "reason": "Reason" } ],
  "section2": [ "Error/Risk 1", ... ],
  "section3": "Core treatment priority focus",
  "section4": "Optional justified improvements (if any)",
  "section5": { "score": 8, "verdict": "One-line brutal summary" },
  "suggestedMeds": [ { "name": "...", "type": "...", "dose": "...", "freq": "...", "duration": "...", "instructions": "..." } ]
}
`;

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
    
    return JSON.parse(result);
  } catch (err) {
    console.error('❌ [AI ERROR] Clinical Audit:', err.message);
    return { error: "Analysis service unavailable" };
  }
}

router.post('/suggest', async (req, res) => {
  const { cc, findings, meds } = req.body;
  if (!cc && !findings && (!meds || meds.length === 0)) {
    return res.status(400).json({ success: false, error: 'Symptoms, diagnosis or medicines required for analysis.' });
  }

  console.log(`🤖 [AI] Reviewing clinical case: ${cc} | ${findings}`);
  const analysis = await analyzeClinicalPrescription(cc, findings, meds || []);
  res.json({ success: true, analysis });
});

module.exports = router;
