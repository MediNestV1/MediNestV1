const express = require('express');
const router = express.Router();
const { validatePrescription } = require('../lib/clinicalVault');

const { createClient } = require('@supabase/supabase-js');

// Supabase Init (same as server.js)
const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Helper: Emoji Mapping for Medicine Categories
function getCategoryEmoji(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tab')) return '💊';
  if (cat.includes('cap')) return '💊';
  if (cat.includes('inj')) return '💉';
  if (cat.includes('syp') || cat.includes('susp')) return '🧪';
  if (cat.includes('crm') || cat.includes('oint') || cat.includes('gel')) return '🧴';
  if (cat.includes('drop')) return '💧';
  return '💊'; // Default
}

// Helper: AI Recommendation Logic (Ranked DB Search + AI Advice)
async function suggestClinicalPath(cc, findings) {
  try {
    // 🔍 STEP 1: Search Medicines from DB based on Symptom Keywords
    const keywords = (cc || '').toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
    const scoreMap = new Map(); // medicineName -> { data, score }

    if (keywords.length > 0) {
      for (const kw of keywords) {
        const { data: rpcData } = await supabase.rpc('search_medicines', { search_term: kw });
        
        if (rpcData && rpcData.length > 0) {
          rpcData.forEach(m => {
            const existing = scoreMap.get(m.name);
            if (existing) {
              existing.score += 1;
            } else {
              scoreMap.set(m.name, {
                name: m.name,
                category: m.category,
                strength: m.strength,
                emoji: getCategoryEmoji(m.category),
                score: 1,
                fromInventory: true
              });
            }
          });
        }
      }
    }

    // Sort by score (descending) and limit to Top 5
    const matchedMeds = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 🤖 STEP 2: AI Advice ONLY
    const systemPrompt = `SYSTEM ROLE:
You are a clinical advisor. Your ONLY task is to provide 2-3 concise, professional clinical advice points (Lifestyle, Diet, or Precaution) for the patient.

FORMAT RULES:
1. Provide 2-3 pointers ONLY.
2. Use standard dark bullet points (•) for each point.
3. DO NOT use emojis.
4. Place EACH pointer on a NEW LINE.
5. Keep each pointer under 10 words.

EXAMPLE:
• Eat fiber-rich foods and curd.
• Drink plenty of oral rehydration fluids.
• Avoid strenuous activity for 2 days.
`;

    const userPrompt = `SYMPTOMS: ${cc} | FINDINGS: ${findings}`;

    const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1
      })
    });

    const aiData = await aiRes.json();
    const suggestedAdvice = aiData.choices?.[0]?.message?.content?.trim() || '';

    return { 
      suggestedMeds: matchedMeds,
      suggestedAdvice: suggestedAdvice
    };
  } catch (err) {
    console.error('❌ [AI ERROR]:', err.message);
    return { error: `AI Connection: ${err.message}` };
  }
}

router.post('/suggest', async (req, res) => {
  const { cc, findings } = req.body;
  console.log(`🤖 [AI] Ranked Inventory Mode: ${cc} | ${findings}`);
  const suggestions = await suggestClinicalPath(cc, findings);
  res.json({ success: true, suggestions });
});

module.exports = router;
