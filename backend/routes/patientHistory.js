// file: backend/routes/patientHistory.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient'); // existing client, uses same API keys

// Helper: generate patient snapshot via NVIDIA
async function generatePatientSummary(patient, prescriptions) {
  if (!prescriptions || prescriptions.length === 0) {
    return 'No medical history or prescriptions available for this patient yet.';
  }

  const prompt = `You are a medical AI assistant. Summarise the following prescriptions into a concise patient snapshot using the exact format below.
🧾 PATIENT SNAPSHOT
Name: ${patient.name}
Age/Gender: ${patient.age || 'Not Specified'} / ${patient.gender || 'Not Specified'}
Mobile: ${patient.contact || 'Not Specified'}
⚠️ Key Conditions:
- ...
💊 Current Medications:
- ...\n📅 Recent Visits:
- ...`;

  // Clean the payload to avoid confusing the AI with IDs and raw nested summary JSONs
  const cleanPayload = prescriptions.map(p => {
    let parsedMeds = p.medicines;
    if (typeof p.medicines === 'string') {
      try { parsedMeds = JSON.parse(p.medicines); } catch(e){}
    }
    return {
      date: p.date || p.created_at,
      doctor: p.doctor_name,
      complaints: p.complaints,
      findings: p.findings,
      medicines: parsedMeds,
      advice: p.advice
    };
  });

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct', 
      messages: [{ role: 'user', content: prompt + '\nIMPORTANT: Do NOT output any raw JSON or arrays at the end of your response. ONLY output the formatted summary.\n' + JSON.stringify(cleanPayload) }]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.warn(`⚠️ [AI Error] Patient History:`, data.error.message);
    return 'Summary could not be generated at this time (AI Service Error). \n\nPlease review the patient visits below instead.';
  }
  
  return data.choices?.[0]?.message?.content?.trim() ?? 'No summary available.';
}

// GET patient history
router.get('/:patientId', async (req, res) => {
  const { patientId } = req.params;

  // Verify patient exists (optional RBAC check)
  const { data: patient, error: patErr } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (patErr || !patient) return res.status(404).json({ error: 'Patient not found' });

  // Fetch visits & prescriptions from the actual 'prescriptions' table used by the frontend
  const { data: rawPrescriptions, error: visErr } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (visErr) return res.status(500).json({ error: visErr.message });

  const visits = (rawPrescriptions || []).map(p => ({
    visit_date: p.date || p.created_at,
    notes: `C/C: ${p.complaints || 'None'} | Findings: ${p.findings || 'None'}`,
    prescription: p
  }));

  // Try to get existing snapshot
  const { data: existing, error: histErr } = await supabase
    .from('patient_histories')
    .select('summary_text')
    .eq('patient_id', patientId)
    .single();

  let summary = existing?.summary_text;
  if (!summary) {
    summary = await generatePatientSummary(patient, rawPrescriptions || []);
    await supabase.from('patient_histories').upsert({
      patient_id: patientId,
      summary_text: summary,
      updated_at: new Date()
    });
  }

  res.json({ patient, visits, summary });
});

module.exports = router;
