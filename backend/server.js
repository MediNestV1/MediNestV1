require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4001;

// Supabase Initialization - BRUTE FORCE FIX for missing .env
const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);
// Patient History route
const patientHistoryRouter = require('./routes/patientHistory');
const recommendationsRouter = require('./routes/recommendations');

// Middleware
app.use(helmet()); // Professional security headers
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/patient-history', patientHistoryRouter);
app.use('/api/recommendations', recommendationsRouter);

// ─── Basic Health Check ───
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MediNest API is running' });
});

app.get('/api/ping', async (req, res) => {
    try {
        // Verify Supabase connectivity
        const { data, error } = await supabase.from('medicines').select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        res.json({ 
            success: true, 
            status: 'online', 
            database: 'connected',
            timestamp: new Date().toISOString() 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            status: 'degraded',
            database: 'disconnected',
            error: err.message,
            timestamp: new Date().toISOString() 
        });
    }
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

        // 2. Prepare Prompt (DYNAMIC MULTILINGUAL)
        const prompt = `Persona: You are a professional medical assistant generating a patient-friendly prescription summary.
        
        INPUT DATA:
        Patient Name: ${patientName}
        Symptoms: ${rx.complaints}
        Findings: ${rx.findings}
        Medicines: ${JSON.stringify(medicines)}  // Format: name, dosage, timing, duration
        Advice: ${rx.advice}
        Follow Up Date: ${rx.followUp || rx.valid_till || 'N/A'}

        OUTPUT LANGUAGE: ${lang}

        STRICT RULES:
        - Write EXCLUSIVELY in the script and natural flow of ${lang}.
        - If the language is an Indian regional dialect (like Bhojpuri, Magahi), use the appropriate Devanagari script and local conversational tone.
        - KEEP ALL MEDICINE NAMES IN ENGLISH (Latin script).
        - Avoid robotic or repetitive phrasing.
        - Tone: Caring, empathetic, human, and trustworthy.
        - Do NOT hallucinate diseases or risks.
        - Respond ONLY with VALID JSON.

        JSON Structure:
        {
          "greeting": "A warm greeting in ${lang} adding the patient name ${patientName}",
          "condition": "Detailed summary of the patient's condition and symptoms in ${lang}. Explain what is happening in a reassuring way.",
          "medicines": [
            {
              "name": "MedicineName (STRICTLY ENGLISH)",
              "purpose": "Detailed explanation in ${lang} of why this is given and exactly how/when to take it."
            }
          ],
          "expectations": "Detailed recovery timeline and positive assurance in ${lang}.",
          "care": "Practical advice in ${lang} regarding diet, rest, and lifestyle based on symptoms.",
          "warnings": ["Specific warning signs to watch for in ${lang}. If none, return empty list []"],
          "next_steps": "Clear follow-up instructions in ${lang}."
        }
        `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        console.log(`🤖 [AI 3/4] Calling NVIDIA API in ${lang}...`);
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer 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`,
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
        } else {
            const errorBody = await response.text();
            console.error(`❌ [AI API ERROR] Status: ${response.status}, Body: ${errorBody}`);
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

// ─── Start Server ───
const startServer = (port) => {
    app.listen(port, () => {
        console.log(`🚀 [AI 4/4] MediNest API is LIVE on port ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is occupied. Please kill the process manually.`);
            process.exit(1);
        } else {
            console.error('❌ Server Error:', err);
        }
    });
};

startServer(PORT);
