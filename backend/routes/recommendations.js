const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// Helper: AI Recommendation Logic
async function getAIRecommendations(cc, findings) {
  const prompt = `You are an expert clinical assistant. Based on the following patient symptoms and diagnosis, recommend exactly 3 to 5 common medicines.
  
  Symptoms (Chief Complaints): ${cc}
  Diagnosis (Findings): ${findings}
  
  CRITICAL: RETURN ONLY VALID JSON. Do not include any conversational text or markdown code blocks.
  
  JSON SCHEMA:
  [
    { "name": "Medicine Name", "type": "Tab/Syp/Cap", "dose": "500mg", "freq": "1-0-1", "duration": "5 days", "instructions": "After food" },
    ...
  ]`;

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
    let result = data.choices?.[0]?.message?.content?.trim() || '[]';
    
    // Cleanup AI artifacts
    if (result.includes('```json')) {
      result = result.split('```json')[1].split('```')[0].trim();
    } else if (result.includes('```')) {
      result = result.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(result);
  } catch (err) {
    console.error('❌ [AI ERROR] Recommendations:', err.message);
    return [];
  }
}

router.post('/suggest', async (req, res) => {
  const { cc, findings } = req.body;
  if (!cc && !findings) {
    return res.status(400).json({ success: false, error: 'Symptoms or diagnosis required for suggestions.' });
  }

  console.log(`🤖 [AI] Suggesting medicines for: ${cc} | ${findings}`);
  const suggestions = await getAIRecommendations(cc, findings);
  res.json({ success: true, suggestions });
});

module.exports = router;
