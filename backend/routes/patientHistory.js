// file: backend/routes/patientHistory.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// Helper: generate patient snapshot via NVIDIA
async function generatePatientSummary(patient, prescriptions) {
  if (!prescriptions || prescriptions.length === 0) {
    return JSON.stringify({
      keyConditions: ["No medical history recorded"],
      currentMedications: ["None"],
      recentVisitsSummary: "No previous visits found."
    });
  }

  const prompt = `You are a medical AI assistant. Summarize the clinical history for ${patient.name} into a structured JSON snapshot.
  
  CRITICAL: RETURN ONLY VALID JSON. Do not include any conversational text, emojis, or markdown code blocks outside of the JSON.
  
  JSON SCHEMA:
  {
    "keyConditions": ["Condition 1", "Condition 2"],
    "currentMedications": ["Med 1", "Med 2"],
    "recentVisitsSummary": "A 1-2 sentence summary of the latest clinical interactions"
  }

  DATA: ${JSON.stringify(prescriptions.map(p => ({
    date: p.date,
    complaints: p.complaints,
    findings: p.findings,
    medicines: p.medicines,
    advice: p.advice
  })))}`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct', 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Robust Extraction: Handle markdown code blocks if AI ignores instructions
    if (result.includes('```json')) {
      result = result.split('```json')[1].split('```')[0].trim();
    } else if (result.includes('```')) {
      result = result.split('```')[1].split('```')[0].trim();
    }
    
    // Fallback regex if markers are missing
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : result; // Return as is if no brackets, parse will handle error
  } catch (err) {
    console.error(`⚠️ [AI Error] Patient History:`, err);
    return JSON.stringify({ error: "AI Service unavailable" });
  }
}

// GET patient history
router.get('/:patientId', async (req, res) => {
  const { patientId } = req.params;

  const { data: patient, error: patErr } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (patErr) return res.status(404).json({ error: 'Patient not found' });

  const { data: rawPrescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  const visits = (rawPrescriptions || []).map(p => ({
    visit_date: p.date || p.created_at,
    doctor: p.doctor_name,
    complaints: p.complaints,
    findings: p.findings,
    medicines: typeof p.medicines === 'string' ? JSON.parse(p.medicines) : p.medicines,
    advice: p.advice,
    prescription_id: p.id
  }));

  // Fetch existing snapshot to check for staleness
  const { data: existing } = await supabase
    .from('patient_histories')
    .select('summary_text, updated_at')
    .eq('patient_id', patientId)
    .single();

  // Smart Refresh Logic: Compare latest visit date with summary update date
  const latestVisitDate = visits.length > 0 ? new Date(visits[0].visit_date) : new Date(0);
  const summaryUpdateDate = existing?.updated_at ? new Date(existing.updated_at) : new Date(0);

  let summaryJson = existing?.summary_text;
  
  // Re-generate if missing OR if new visits added since last summary
  if (!summaryJson || latestVisitDate > summaryUpdateDate) {
    console.log(`🤖 [AI REAL-TIME] ${!summaryJson ? 'Generating initial' : 'Refreshing'} snapshot for ${patient.name}...`);
    const generated = await generatePatientSummary(patient, rawPrescriptions || []);
    summaryJson = generated;
    
    await supabase.from('patient_histories').upsert({
      patient_id: patientId,
      summary_text: generated,
      updated_at: new Date()
    }, { onConflict: 'patient_id' });
  }

  let summaryObj;
  try {
    summaryObj = JSON.parse(summaryJson);
  } catch (err) {
    console.error('❌ [PARSE ERROR] AI summary is not valid JSON:', summaryJson.slice(0, 100));
    summaryObj = {
      keyConditions: ["History assessment in progress"],
      currentMedications: ["Reviewing records..."],
      recentVisitsSummary: "Clinical snapshot is currently being processed."
    };
  }

  res.json({ patient, visits, summary: summaryObj });
});

module.exports = router;
