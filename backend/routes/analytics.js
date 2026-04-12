const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

const calcTrend = (curr, prev) => {
    if (prev === 0 && curr > 0) return 100;
    if (prev === 0 && curr === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
}

const parseMedicines = (medicinesStr) => {
    if (!medicinesStr || medicinesStr.length < 3) return [];
    try {
        const meds = typeof medicinesStr === 'string' ? JSON.parse(medicinesStr) : medicinesStr;
        return Array.isArray(meds) ? meds : [];
    } catch(e) { return []; }
}

const getAgeGroup = (ageStr) => {
    const age = parseInt(ageStr);
    if (isNaN(age)) return 'Unknown';
    if (age <= 18) return '0-18';
    if (age <= 40) return '19-40';
    return '40+';
};

router.get('/dashboard', async (req, res) => {
    const { clinic_id, baseStart, baseEnd, compareStart, compareEnd, performCompare } = req.query;
    if (!clinic_id) return res.status(400).json({ success: false, error: 'clinic_id is required' });

    try {
        const hasBase = baseStart && baseEnd;
        const doCompare = performCompare === 'true' && compareStart && compareEnd;
        
        let currData = [];
        let prevData = [];
        let currReceipts = [];
        let prevReceipts = [];

        // Promises builder
        let promises = [];
        
        let currPresQuery = supabase.from('prescriptions').select('*, patients(*)').eq('clinic_id', clinic_id);
        let currRecQuery = supabase.from('receipts').select('total_amount, printed_at').eq('clinic_id', clinic_id);
        
        if (hasBase) {
            currPresQuery = currPresQuery.gte('created_at', baseStart).lte('created_at', baseEnd);
            currRecQuery = currRecQuery.gte('printed_at', baseStart).lte('printed_at', baseEnd);
        }
        promises.push(currPresQuery, currRecQuery);
        
        if (doCompare) {
            let prevPresQuery = supabase.from('prescriptions').select('*, patients(*)').eq('clinic_id', clinic_id)
                                        .gte('created_at', compareStart).lte('created_at', compareEnd);
            let prevRecQuery = supabase.from('receipts').select('total_amount, printed_at').eq('clinic_id', clinic_id)
                                        .gte('printed_at', compareStart).lte('printed_at', compareEnd);
            promises.push(prevPresQuery, prevRecQuery);
        }

        const results = await Promise.all(promises);
        
        currData = results[0].data || [];
        currReceipts = results[1].data || [];
        
        if (doCompare) {
            prevData = results[2].data || [];
            prevReceipts = results[3].data || [];
        }

        // --- Aggregation logic ---
        const diagMap = {};
        const medMap = {};
        const ageDiseaseMap = { '0-18': {}, '19-40': {}, '40+': {}, 'Unknown': {} };
        const genderMap = {};
        const dateMap = {}; // Timeline aggregator
        let totalMedOccurrences = 0;

        currData.forEach(p => {
            const d = p.diagnosis ? p.diagnosis.trim().toUpperCase() : null;
            if (d) {
                diagMap[d] = (diagMap[d] || 0) + 1;
                
                // Track timeline
                if (p.created_at) {
                    const dateStr = new Date(p.created_at).toISOString().split('T')[0];
                    if (!dateMap[dateStr]) dateMap[dateStr] = {};
                    dateMap[dateStr][d] = (dateMap[dateStr][d] || 0) + 1;
                }
            }

            const meds = parseMedicines(p.medicines);
            meds.forEach(m => {
                if (m.name) {
                    const name = m.name.trim().toUpperCase();
                    const category = m.type || m.category || 'Medication';
                    if (!medMap[name]) medMap[name] = { count: 0, category };
                    medMap[name].count += 1;
                    totalMedOccurrences += 1;
                }
            });

            if (p.patients) {
                const g = p.patients.gender ? p.patients.gender.trim() : 'Unknown';
                genderMap[g] = (genderMap[g] || 0) + 1;
                const ag = getAgeGroup(p.patients.age);
                if (d) ageDiseaseMap[ag][d] = (ageDiseaseMap[ag][d] || 0) + 1;
            }
        });

        // Prev logic for Trends
        const prevDiagMap = {};
        if (doCompare) {
            prevData.forEach(p => {
                const d = p.diagnosis ? p.diagnosis.trim().toUpperCase() : null;
                if (d) prevDiagMap[d] = (prevDiagMap[d] || 0) + 1;
            });
        }

        const currRevenue = currReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const prevRevenue = prevReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);

        let finalDiagnoses = Object.entries(diagMap).map(([name, count]) => {
            const pCount = prevDiagMap[name] || 0;
            const trend = doCompare ? calcTrend(count, pCount) : null;
            const percentage = currData.length > 0 ? Math.round((count / currData.length) * 100) : 0;
            return { diagnosis: name, count, percentage, trend, prevCount: pCount };
        }).sort((a,b) => b.count - a.count).slice(0, 20); // allow up to 20

        let finalMedicines = Object.entries(medMap).map(([name, data]) => {
            const pct = Math.round((data.count / (totalMedOccurrences || 1)) * 100);
            return {
                medicine_name: name,
                category: data.category,
                count: data.count,
                isOverused: pct > 20
            };
        }).sort((a,b) => b.count - a.count).slice(0, 20); // allow up to 20

        const demoAdvanced = Object.entries(ageDiseaseMap).map(([ageGroup, diseases]) => {
            const sorted = Object.entries(diseases).sort((a,b) => b[1] - a[1]);
            const topDisease = sorted.length > 0 ? sorted[0][0] : 'None';
            const totalInGroup = sorted.reduce((sum, [,v]) => sum + v, 0);
            return { ageGroup, topDisease, total: totalInGroup };
        }).filter(a => a.total > 0);
        
        // Revenue Timeline aggregation
        const revDateMap = {};
        currReceipts.forEach(r => {
            if (r.printed_at) {
                const dateStr = new Date(r.printed_at).toISOString().split('T')[0];
                revDateMap[dateStr] = (revDateMap[dateStr] || 0) + (r.total_amount || 0);
            }
        });
        const revenueTimeline = Object.keys(revDateMap).sort().map(d => ({ 
            date: d, 
            amount: revDateMap[d] 
        }));

        const summaryData = {
            totalPatients: currData.length,
            prevTotalPatients: prevData.length,
            patientsTrend: doCompare ? calcTrend(currData.length, prevData.length) : null,
            revenue: currRevenue,
            prevRevenue: prevRevenue,
            revenueTrend: doCompare ? calcTrend(currRevenue, prevRevenue) : null,
            avgConsultTime: '12m',
            prevConsultTime: '14m',
            consultTrend: doCompare ? -14 : null
        };

        const top3Names = finalDiagnoses.slice(0, 3).map(x => x.diagnosis);
        const diseaseTimeline = Object.keys(dateMap).sort().map(dateStr => {
           const obj = { date: dateStr };
           top3Names.forEach(n => {
              obj[n] = dateMap[dateStr][n] || 0;
           });
           return obj;
        });

        res.json({
            success: true,
            data: {
                summary: summaryData,
                diagnoses: finalDiagnoses,
                medicines: finalMedicines,
                demographics: Object.entries(genderMap).map(([k,v]) => ({ gender: k, count: v })),
                advancedDemographics: demoAdvanced,
                diseaseTimeline: diseaseTimeline,
                revenueTimeline: revenueTimeline
            }
        });

    } catch (error) {
        console.error('❌ Analytics Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics', details: error.message });
    }
});

router.get('/patients', async (req, res) => {
   const { clinic_id, diagnosis, baseStart, baseEnd } = req.query;
   if (!clinic_id || !diagnosis) return res.status(400).json({ success: false, error: 'Missing params' });

   try {
       const hasBase = baseStart && baseEnd;
       let query = supabase.from('prescriptions')
          .select('*, patients(*)')
          .eq('clinic_id', clinic_id)
          .ilike('diagnosis', `%${diagnosis}%`);
       
       if (hasBase) query = query.gte('created_at', baseStart).lte('created_at', baseEnd);

       const { data, error } = await query;
       if (error) throw error;
       
       const uniquePatients = [];
       const seen = new Set();
       (data || []).forEach(rx => {
           if (rx.patients && !seen.has(rx.patients.id)) {
               seen.add(rx.patients.id);
               uniquePatients.push({ ...rx.patients, prescription_date: rx.created_at });
           }
       });

       res.json({ success: true, count: uniquePatients.length, data: uniquePatients });
   } catch(e) {
       res.status(500).json({ success: false, error: 'Database API fail' });
   }
});

module.exports = router;
