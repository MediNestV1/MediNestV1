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
        // 1. Fetch Rx Data
        const { data: rx, error: rxError } = await supabase
            .from('prescriptions')
            .select('*, patients(name)')
            .eq('id', id)
            .single();

        if (rxError || !rx) throw new Error('Prescription not found');
        console.log(`🤖 [AI 2/4] Rx Data loaded. Patient: ${rx.patients?.name}`);

        // 2. Prepare Prompt & Timeout
        const patientName = rx.patients?.name || 'Patient';
        const medicines = typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines;
        
        const prompt = `Medical Assistant specialized in patient-friendly summaries.
        Patient: ${patientName}
        Chief Complaints: ${rx.complaints}
        Clinical Findings: ${rx.findings}
        Prescribed Medicines: ${JSON.stringify(medicines)}
        Advice: ${rx.advice}
        Follow-up: ${rx.valid_till || 'N/A'}

        Task: Generate a warm, reassuring patient summary in valid JSON format. Keep instructions clear and language simple.
        
        Format:
        {
          "greeting": "Hello ${patientName} 👋",
          "visit_reason": "Summary of symptoms.",
          "explanation": "Simple explanation + reassurance.",
          "medicines": ["Med Name -> Instruction"],
          "expectations": "Recovery timeline + reassurance",
          "warning": "When to seek medical help",
          "lifestyle": "Diet/rest/home care tips",
          "follow_up": "Next steps"
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

        if (!summaryStr) {
            console.warn(`⚠️ AI Response empty or null. Using fallback generic summary.`);
            summaryStr = JSON.stringify({
                greeting: `Hello ${patientName} 👋`,
                visit_reason: "Thank you for visiting the clinic today.",
                explanation: "Take your prescribed medications regularly for a speedy recovery.",
                medicines: ["Please follow the exact dosage on your prescription."],
                expectations: "You should see improvement within a few days.",
                warning: "If your symptoms worsen or persist, please contact us immediately.",
                lifestyle: "Drink plenty of water and get enough rest.",
                follow_up: "Visit again as advised by the doctor."
            });
        }
        
        // Clean accidental markdown code blocks
        summaryStr = summaryStr.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const summaryJson = JSON.parse(summaryStr);
        console.log(`🤖 [AI 4/4] Summary generated. Saving to DB...`);

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
