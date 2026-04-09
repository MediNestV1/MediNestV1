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
const { router: patientHistoryRouter, generatePatientSummary } = require('./routes/patientHistory');

// AI Request Deduplication Lock
const activeAiRequests = new Map();

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://medinestv1.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use('/api/patient-history', patientHistoryRouter);

// ─── Basic Health Check ───
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: ' Backend is running' });
});

// ─── SUPER ADMIN MIDDLEWARE ───
const requireSuperAdmin = (req, res, next) => {
    const providedKey = req.headers['x-admin-key'];
    const actualKey = (process.env.ADMIN_PASSWORD || '').trim();

    console.log(`📡 [ADMIN REQ] ${req.method} ${req.path}`);

    if (!providedKey || providedKey !== actualKey) {
        console.warn(`⛔ [AUTH FAIL] ${req.method} ${req.path}`);
        console.log(`   - Provided length: ${providedKey ? providedKey.length : 0}`);
        console.log(`   - Expected length: ${actualKey.length}`);
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Key' });
    }
    next();
};

// ─── SECURE SUPER ADMIN ENDPOINTS ───

// 1. Get all clinics and their doctors
app.get('/api/superadmin/clinics', requireSuperAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clinics')
            .select('*, clinic_doctors(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Approve or Suspend a clinic
app.post('/api/superadmin/clinics/status', requireSuperAdmin, async (req, res) => {
    const { clinicId, status } = req.body;
    console.log('📬 Status Update Request:', { clinicId, status });

    if (!clinicId || !['active', 'suspended'].includes(status)) {
        console.warn('⚠️ Invalid parameters received:', { clinicId, status });
        return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    try {
        const approvedAt = status === 'active' ? new Date().toISOString() : null;
        const { error } = await supabase
            .from('clinics')
            .update({ status, approved_at: approvedAt })
            .eq('id', clinicId);

        if (error) {
            console.error('❌ Supabase Update Error:', error);
            throw error;
        }
        res.json({ success: true, message: `Clinic status updated to ${status}` });
    } catch (err) {
        console.error('❌ Status Update Backend Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
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
    const { rxData } = req.body; // Faster start if data sent from frontend

    // Deduplication Lock (Avoid double-trigger from Doctor + Patient)
    if (activeAiRequests.has(id)) {
        console.log(`⏳ [LOCK] AI Summary already in progress for Rx: ${id}`);
        return res.json({ success: true, message: 'Generation already in progress' });
    }
    activeAiRequests.set(id, Date.now());

    console.log(`\n-----------------------------------------`);
    console.log(`🤖 [TRIGGER] AI Summary request for Rx: ${id}`);
    console.log(`🌍 [ORIGIN] ${req.get('origin') || 'Unknown Origin'}`);
    console.log(`-----------------------------------------`);

    try {
        let rx = rxData;
        let patientId = null;
        let patientName = 'Patient';

        // 1. Get Rx Data (either from body or DB)
        if (!rx) {
            console.log(`🤖 [AI 1/4] Fetching Rx from DB (no rxData in body)`);
            const { data, error } = await supabase
                .from('prescriptions')
                .select('*, patients(name, age, gender, contact)')
                .eq('id', id)
                .single();
            if (error || !data) throw new Error('Prescription not found');
            rx = data;
        }

        patientId = rx.patient_id;
        patientName = rx.patients?.name || 'Patient';
        const medicines = typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines;

        console.log(`🤖 [AI 2/4] Data ready. Patient: ${patientName}`);

        // 2. Prepare Prompt
        const prompt = `You are an expert, compassionate doctor's medical assistant. Analyze the clinical prescription and generate a structured patient summary in the following strict JSON format.
        
        Format:
        {
          "greeting": "A warm greeting using ${patientName}'s name",
          "condition_summary": "Simple, non-medical explanation of the symptoms and findings",
          "medicines": ["List of medicines with their purpose, format: Name - Dose (To help with [Purpose])"],
          "timeline": "When the patient can expect to feel better and duration of care",
          "lifestyle": "Specific diet advice (mention specific foods to eat/avoid), care instructions, and precautions",
          "warning_signs": ["Bullet points of specific symptoms that mean the patient should contact the clinic immediately"],
          "follow_up": "Specific details on when to revisit or next steps"
        }

        Rules:
        - Keep language simple and warm.
        - Avoid medical jargon (e.g., use 'swelling' instead of 'edema').
        - No assumptions beyond given data.
        - The "medicines" field MUST be an array of simple strings.
        - The "warning_signs" field MUST be an array of simple strings.

        Clinical Data:
        Patient Name: ${patientName}
        Chief Complaints: ${rx.complaints}
        Clinical Findings: ${rx.findings}
        Medicines: ${JSON.stringify(medicines)}
        Advice: ${rx.advice}
        Follow-up: ${rx.valid_till || 'As advised'}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        console.log(`🤖 [AI 3/4] Calling NVIDIA API...`);
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta/llama-3.1-70b-instruct",
                messages: [{ role: "user", content: prompt }]
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let summaryStr = null;
        if (response.ok) {
            const aiResponse = await response.json();
            summaryStr = aiResponse.choices?.[0]?.message?.content;
        }

        if (!summaryStr) {
            summaryStr = JSON.stringify({
                greeting: `Hello ${patientName} 👋`,
                condition_summary: "We're taking care of your health based on your symptoms today.",
                medicines: ["Follow the dosage instructions on your prescription."],
                timeline: "You should start feeling better as you follow the treatment.",
                lifestyle: "Rest well, stay hydrated, and follow the diet as advised.",
                warning_signs: ["Severe pain", "High fever", "Difficulty breathing"],
                follow_up: "Please visit us again as mentioned in your prescription."
            });
        }


        summaryStr = summaryStr.replace(/```json/gi, '').replace(/```/g, '').trim();
        const summaryJson = JSON.parse(summaryStr);
        console.log(`🤖 [AI 4/4] Summary generated. Saving...`);

        // 3. Save Rx Summary
        await supabase.from('prescriptions').update({ ai_summary: summaryJson }).eq('id', id);

        // 4. Background Task: Update Patient History Snapshot
        if (patientId) {
            console.log(`🔄 [HISTORY] Triggering snapshot update for Patient: ${patientId}`);
            // We do this in the background (don't await) 
            (async () => {
                try {
                    const { data: allRx } = await supabase
                        .from('prescriptions')
                        .select('*')
                        .eq('patient_id', patientId)
                        .order('date', { ascending: false });

                    const { data: patient } = await supabase.from('patients').select('*').eq('id', patientId).single();

                    if (patient && allRx) {
                        const newHistory = await generatePatientSummary(patient, allRx);
                        await supabase.from('patient_histories').upsert({
                            patient_id: patientId,
                            summary_text: newHistory,
                            updated_at: new Date()
                        });
                        console.log(`✅ [HISTORY] Snapshot updated successfully.`);
                    }
                } catch (e) {
                    console.error("❌ [HISTORY ERROR]:", e.message);
                }
            })();
        }

        res.json({ success: true, summary: summaryJson });
    } catch (err) {
        console.error(`❌ [AI ERROR] Rx ${id}:`, err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        activeAiRequests.delete(id);
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
