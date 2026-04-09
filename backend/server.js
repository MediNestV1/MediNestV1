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
    console.log(`🤖 [AI 1/4] Starting generation for Rx: ${id}`);

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
        } else {
            console.log(`🚀 [AI 2/4] Ultra-Fast: Using provided data (Zero-Fetch)`);
        }

        // 2. Prepare Prompt (EMPATHETIC & DETAILED)
        const prompt = `Medical Assistant Persona: Act as a warm, world-class, caring family doctor. 
        Patient Name: ${patientName}
        Complaints: ${rx.complaints}
        Findings: ${rx.findings}
        Medicines & Dosages: ${JSON.stringify(medicines)}
        Doctor's Advice: ${rx.advice}
        Follow-up: ${rx.followUp || rx.valid_till || 'N/A'}

        Instructions:
        - Be warm, empathetic, and reassuring (e.g., "I'm sorry you're feeling under the weather").
        - Explain the condition in VERY simple, human terms.
        - provide specific, detailed diet and rest advice based on the symptoms (e.g., if cough: warm salt water gargles; if fever: light cotton clothes and fluids).
        - Respond ONLY with VALID JSON.

        JSON Structure:
        {
          "greeting": "Warm, personalized greeting",
          "condition": "Simple explanation + reassurance",
          "medicines": [{"name": "Med Name", "purpose": "Why to take it in simple words"}],
          "expectations": "Recovery timeline & reassurance",
          "care": "Detailed Diet + Rest + Precautions",
          "warnings": ["Sign 1", "Sign 2"],
          "next_steps": "Follow-up details"
        }`;

        const controller = new AbortController();


        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        console.log(`🤖 [AI 3/4] Calling NVIDIA API (8B model for speed)...`);
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta/llama-3.1-8b-instruct",
                messages: [{ role: "user", content: prompt }]
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let summaryStr = null;

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ [AI RATE LIMIT/ERROR] NVIDIA API returned ${response.status}: ${errText}`);
            // Do NOT throw an error that crashes the backend 500 response.
            // Just let summaryStr remain null so the generic fallback takes over.
        } else {
            const aiResponse = await response.json();
            console.log(`🤖 [AI RAW] NVIDIA Response:`, JSON.stringify(aiResponse).slice(0, 500));
            summaryStr = aiResponse.choices?.[0]?.message?.content;
        }

        let summaryJson;
        try {
            // Robust Regex extraction for JSON block
            const jsonMatch = summaryStr.match(/\{[\s\S]*\}/);
            const cleanedStr = jsonMatch ? jsonMatch[0] : summaryStr;
            summaryJson = JSON.parse(cleanedStr);
        } catch (parseErr) {
            console.error(`⚠️ AI JSON Parse Failed. Using emergency humanized fallback.`, parseErr.message);
            summaryJson = {
                greeting: `Hello ${patientName} 👋`,
                condition: "I'm sorry to hear you're not feeling your best. I've put together this quick guide based on your visit today to help you recover quickly.",
                medicines: Array.isArray(medicines) ? medicines.map(m => ({ name: m.name || 'Medicine', purpose: "To help you feel better and treat your specific symptoms." })) : [],
                expectations: "With the right rest and medicine, you should start feeling much more comfortable in a few days.",
                care: "Try to get plenty of sleep, stay well-hydrated with warm fluids, and eat light, easily digestible meals like porridge or soup.",
                warnings: ["If your fever stays very high", "If you find it difficult to breathe"],
                next_steps: "Please reach out or visit us again as advised by the doctor."
            };
        }

        console.log(`🤖 [AI 4/4] Summary ready. Saving...`);

        // 3. Save to DB
        const { error: updateError } = await supabase
            .from('prescriptions')
            .update({ ai_summary: summaryJson })
            .eq('id', id);

        if (updateError) throw updateError;
        console.log(`✅ [AI SUCCESS] Summary ready for Rx: ${id}`);

        res.json({ success: true, summary: summaryJson });
    } catch (err) {
        console.error(`❌ [AI ERROR] Rx ${id}:`, err.message);
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
