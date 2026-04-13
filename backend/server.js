require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4001;

// Supabase Initialization - Using Service Role for background tasks
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
    console.error("❌ CRITICAL ERROR: Supabase config missing in server.js");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);
// Patient History route
const patientHistoryRouter = require('./routes/patientHistory');
const recommendationsRouter = require('./routes/recommendations');
const queueRouter = require('./routes/queue');
const analyticsRouter = require('./routes/analytics');
const notificationsRouter = require('./routes/notifications');

// Validation Helpers
function isValidHindi(text) {
    if (!text) return true;
    // Check if the text contains Devanagari characters
    // Allowing for common punctuation and whitespace
    return /^[\u0900-\u097F\s.,!?:\n-ँ-ःा-्]*$/.test(text);
}

// --- SECURITY MIDDLEWARE ---
// Verifies the Supabase JWT from the Authorization header
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid user session');
        req.user = user; // Attach user to request for authorization checks
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Session expired or invalid' });
    }
};

// Middleware
app.use(helmet()); // Professional security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Protected Routes (Require Authentication)
app.use('/api/patient-history', authenticate, patientHistoryRouter);
app.use('/api/recommendations', authenticate, recommendationsRouter);
app.use('/api/queue', authenticate, queueRouter);
app.use('/api/analytics', authenticate, analyticsRouter);
app.use('/api/notifications', authenticate, notificationsRouter);

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



// ─── AI SUMMARY (PRODUCTION GRADE) ──────────────────────────────────
// Protected by authenticate middleware above
app.post('/api/prescriptions/:id/ai-summary', authenticate, async (req, res) => {
    const { id } = req.params;
    const { lang = 'English', persist = true } = req.body || req.query || {};
    
    console.log(`🤖 [AI] Starting clinical snapshot for Rx: ${id} (Language: ${lang}, Persist: ${persist})`);

    try {
        let rx = req.body || {};
        let patientName = rx.patientName || 'Patient';
        let medicines = rx.medicines || [];

        // 1. Fetch Rx Data if incomplete
        if (!rx.complaints || !rx.findings) {
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

        // 2. Production Grade Prompt Construction
        const systemRole = `
You are the "✦ Secure AI Agent Record", a specialized clinical assistant. Your goal is to provide a reassuring, safe, and professional recovery guide.

IMPORTANT: RETURN ONLY A PURE JSON OBJECT. NO PREAMBLE. NO GREETINGS. NO INTRODUCTIONS.

AI ROLE:
- You ONLY explain the doctor's prescription. You DO NOT prescribe or guess.

MEDICAL RULES (STRICT):
1. DOSAGE LOGIC: 
   - IF doctor provided dosage/frequency (e.g., "1-0-1", "SOS"): Show EXACT SAME and explain it (e.g., ${lang === 'Hindi' ? '"1-0-1 (सुबह-दोपहर-शाम)"' : '"1-0-1 (Morning-Noon-Night)"'}).
   - IF doctor did NOT provide dosage: DO NOT GUESS. Show: ${lang === 'Hindi' ? '"डॉक्टर के अनुसार लें"' : '"As directed by doctor"'}.
2. FORBIDDEN: NEVER suggest "Twice a day", "Morning/Night", or "5 days" unless explicitly provided in the INPUT med list.
3. PROTOCOLS: If Dengue/Viral detected, prioritize hydration and bleeding warning signs.

TONE & STYLE:
- Warm, encouraging, supportive in ${lang}.
- Use specific emojis: 💊, ⏳, 🥗, 🚨, 📅.

JSON OUTPUT FORMAT:
{
  "greeting": "👋 Hello ${patientName} in ${lang}",
  "condition": "Explanation of the illness in ${lang}",
  "medicines": [
    {
      "name": "Medicine name in ${lang}",
      "purpose": "Purpose of medicine in ${lang}",
      "dosage": "Exact dosage from input + explanation ${lang === 'Hindi' ? '(e.g. 1-0-1 (सुबह-दोपहर-शाम))' : '(e.g. 1-0-1 (Morning-Noon-Night))'} OR ${lang === 'Hindi' ? 'डॉक्टर के अनुसार लें' : 'As directed by doctor'}"
    }
  ],
  "expectations": "Brief recovery timeline and what the patient should expect in the next 2-3 days in ${lang}",
  "care": "Simple diet/rest points in ${lang}",
  "warnings": ["Alerts in ${lang}"],
  "next_steps": "Closing in ${lang}"
}
`;

        const userPrompt = `
INPUT DATA:
- Patient: ${patientName}
- Diagnosis: ${rx.diagnosis || 'N/A'}
- Findings (O/E): ${rx.findings || 'N/A'}
- Symptoms: ${rx.complaints || 'N/A'}
- Medicines: ${JSON.stringify(medicines)}
- Advice: ${rx.advice}
- Follow-up Date: ${rx.followUp || rx.valid_till || 'N/A'}
`;

        let summaryJson = null;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts && !summaryJson) {
            attempts++;
            console.log(`🤖 [AI] Generation attempt ${attempts}/${maxAttempts} for ${lang}...`);
            
            const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "meta/llama-3.1-8b-instruct",
                    messages: [
                        { role: "system", content: systemRole },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 1200, // Increased to prevent truncation
                    top_p: 1
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [AI API ERROR]:`, errorText);
                if (attempts === maxAttempts) throw new Error('AI Service unavailable');
                continue;
            }

            const aiResponse = await response.json();
            let content = aiResponse.choices?.[0]?.message?.content || '';
            
            try {
                // 1. Standardize cleanup for control characters
                content = content.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, '');

                // 2. Locate the JSON block
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');
                
                if (firstBrace === -1 || lastBrace === -1) {
                  throw new Error('No JSON object found in AI response');
                }

                let jsonStr = content.substring(firstBrace, lastBrace + 1);

                // 3. Aggressive Sanitization: Replace literal newlines and tabs with spaces
                // This is the most common cause of JSON.parse failures in LLM outputs
                jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
                
                const parsed = JSON.parse(jsonStr);
                
                // VALIDATION: If lang is Hindi, check if it's pure Hindi
                if (lang === 'Hindi') {
                    const isPure = isValidHindi(parsed.condition) && isValidHindi(parsed.care);
                    if (!isPure && attempts < maxAttempts) {
                        console.warn(`⚠️ [AI] Language mix detected in Hindi output. Retrying...`);
                        continue;
                    }
                }
                
                summaryJson = parsed;
            } catch (pErr) {
                console.error(`⚠️ [AI] JSON Extraction failed on attempt ${attempts}: ${pErr.message}`);
                console.log('--- FAILED CONTENT ---');
                console.log(content);
                console.log('----------------------');
                if (attempts === maxAttempts) throw pErr;
            }
        }

        // 3. Persist and Return
        if (persist === true || persist === 'true') {
            await supabase.from('prescriptions').update({ ai_summary: summaryJson }).eq('id', id);
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
    console.error('🔥 Global Error:', err.message);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
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
