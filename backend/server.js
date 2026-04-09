require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRole);
// Patient History route
const patientHistoryRouter = require('./routes/patientHistory');

// Middleware
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use('/api/patient-history', patientHistoryRouter);

// ─── Basic Health Check ───
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SSK Backend is running' });
});



// ─── Secure DB Operations (Example) ───
app.post('/api/secure-save', async (req, res) => {
    const { table, data } = req.body;
    try {
        const { data: result, error } = await supabase.from(table).insert(data).select();
        if (error) throw error;
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── AI SUMMARY (OPENROUTER) ──────────────────────────────────
app.post('/api/prescriptions/:id/ai-summary', async (req, res) => {
    const { id } = req.params;
    const { lang = 'English', persist = true } = req.body || req.query || {};
    
    console.log(`🤖 [AI 1/4] Starting ${lang} generation for Rx: ${id} (Persist: ${persist})`);

    try {
        let rx = req.body || {};
        let patientName = rx.patientName || 'Patient';
        let medicines = rx.medicines || [];

        // 1. Fetch Rx Data ONLY if not provided or incomplete (Zero-Fetch Strategy)
        if (!rx.complaints || !rx.findings) {
            console.log(`🤖 [AI 2/4] Data incomplete. Fetching from DB...`);
            const { data: dbRx, error: rxError } = await supabase
                .from('prescriptions')
                .select('*, patients(name)')
                .eq('id', id)
                .single();

            if (rxError || !dbRx) throw new Error('Prescription not found');
            rx = dbRx;
            patientName = dbRx.patients?.name || 'Patient';
            medicines = typeof dbRx.medicines === 'string' ? JSON.parse(dbRx.medicines) : dbRx.medicines;
        }

        // 2. Prepare Prompt (EMPATHETIC & DETAILED)
        let prompt;
        if (lang === 'Hindi') {
            prompt = `Persona: You are a professional medical assistant generating a patient-friendly prescription summary.
            
            INPUT DATA:
            Patient Name: ${patientName}
            Symptoms: ${rx.complaints}
            Findings: ${rx.findings}
            Medicines: ${JSON.stringify(medicines)}  // Format: name, dosage, timing, duration
            Advice: ${rx.advice}
            Follow Up Date: ${rx.followUp || rx.valid_till || 'N/A'}

            STRICT RULES:
            - Write in simple, natural Hindi (not robotic or repetitive).
            - Keep all medicine names strictly in English.
            - Avoid repeating any sentence or idea.
            - Tone: Caring, human, and trustworthy.
            - Do NOT hallucinate diseases or risks.
            - Do NOT use Latin letters for Hindi words.

            JSON Structure (STRICT HINDI INSTRUCTIONS):
            {
              "greeting": "👋 नमस्ते ${patientName}",
              "condition": "2-3 लाइन में सरल हिंदी में स्थिति का सार। Symptoms साफ लिखो। कोई exaggeration या repetition नहीं।",
              "medicines": [
                {
                  "name": "MedicineName (English only)",
                  "purpose": "हिंदी में: क्यों दी गई है + कैसे लेना है (max 1 लाइन, repeat नहीं करना)"
                }
              ],
              "expectations": "ठीक होने में कितना समय लगेगा + reassurance (max 2 लाइन, realistic)",
              "care": "सिर्फ काम की सलाह। generic लाइन नहीं। max 3 points एक छोटे paragraph में।",
              "warnings": "सिर्फ ज़रूरी warning signs। अगर कुछ खास नहीं है तो \"\" लौटाओ।",
              "next_steps": "Follow-up या अगला कदम (1-2 लाइन, बिना repeat किए)"
            }

            - Respond ONLY with VALID JSON.
            `;
        } else {
            prompt = `Persona: You are a professional medical assistant generating a patient-friendly prescription summary.
            
            INPUT DATA:
            Patient Name: ${patientName}
            Symptoms: ${rx.complaints}
            Findings: ${rx.findings}
            Medicines: ${JSON.stringify(medicines)}
            Advice: ${rx.advice}
            Follow Up Date: ${rx.followUp || rx.valid_till || 'N/A'}

            Instructions (ENGLISH):
            - Explain the medical condition in simple, reassuring, and professional terms.
            - Provide clear diet, rest, and precaution instructions based on symptoms.
            - Tone: Caring, human, and trustworthy.
            - Respond ONLY with VALID JSON.

            JSON Structure:
            {
              "greeting": "👋 Hello ${patientName}",
              "condition": "Explanation + reassurance",
              "medicines": [{"name": "Med Name", "purpose": "Clear purpose and how to take it"}],
              "expectations": "Recovery timeline & reassurance",
              "care": "Diet/Rest/Precautions (No filler)",
              "warnings": ["Real sign to watch out for if condition worsens"],
              "next_steps": "Follow-up details (Keep it concise)"
            }`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        console.log(`🤖 [AI 3/4] Calling NVIDIA API in ${lang}...`);
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta/llama-3.1-8b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2, // Lower temperature for stricter rule adherence
                top_p: 0.7
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let summaryStr = null;
        if (response.ok) {
            const aiResponse = await response.json();
            summaryStr = aiResponse.choices?.[0]?.message?.content;
        }

        let summaryJson;
        try {
            const jsonMatch = summaryStr?.match(/\{[\s\S]*\}/);
            summaryJson = JSON.parse(jsonMatch ? jsonMatch[0] : summaryStr);
        } catch (parseErr) {
            console.error(`⚠️ AI JSON Parse Failed. Using emergency fallback.`);
            summaryJson = {
                greeting: lang === 'Hindi' ? `नमस्ते ${patientName} 👋` : `Hello ${patientName} 👋`,
                condition: lang === 'Hindi' ? "हमें आपकी सेहत की फिक्र है। आपकी जल्दी रिकवरी के लिए हमने यह गाइड बनाई है।" : "We care about your health. We've created this guide for your quick recovery.",
                medicines: Array.isArray(medicines) ? medicines.map(m => ({ name: m.name || 'Medicine', purpose: "As prescribed" })) : [],
                expectations: lang === 'Hindi' ? "थोड़े ही दिनों में आप बेहतर महसूस करेंगे।" : "You will feel better within a few days.",
                care: lang === 'Hindi' ? "भरपूर आराम करें और तरल पदार्थ लेते रहें।" : "Rest well and stay hydrated.",
                warnings: [lang === 'Hindi' ? "अगर तबियत बिगड़े तो तुरंत बताएं" : "Contact us if symptoms worsen"],
                next_steps: lang === 'Hindi' ? "डॉक्टर की सलाह का पालन करें।" : "Follow the doctor's advice."
            };
        }

        // 3. Save to DB ONLY if persist is true (Stateless Hindi Support)
        if (persist === true || persist === 'true') {
            console.log(`🤖 [AI 4/4] Persisting summary to DB...`);
            await supabase.from('prescriptions').update({ ai_summary: summaryJson }).eq('id', id);
        } else {
            console.log(`🤖 [AI 4/4] Stateless generation (Skipping DB update)`);
        }

        res.json({ success: true, summary: summaryJson });
    } catch (err) {
        console.error(`❌ [AI ERROR]:`, err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- GLOBAL JSON ERROR HANDLER ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
