'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useClinic();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.host === 'localhost:3000' ? 'http://localhost:3000' : 'https://medinest.in'}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('❌ Landing: Google error:', err);
    }
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
           <Image src="/assets/medinest_logo.png" alt="MediNest" width={38} height={38} />
           <span>MediNest</span>
        </Link>
        <div className={styles.navLinks}>
           <a href="#features">Features</a>
           <a href="#demo">Demo</a>
           <a href="#pricing">Pricing</a>
        </div>
        <div className={styles.navCta}>
           <Link href="/auth?tab=login" className={styles.btnOutlineNav}>Log In</Link>
           <Link href="/auth?tab=register" className={styles.btnSolidNav}>Get Started Free →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
           <div className={styles.badge}>
             <span style={{ color: '#10b981' }}>●</span> The smartest way to run your clinic.
           </div>
           <h1 className={styles.heroH1}>
             Run your clinic the<br /><span>smart way.</span>
           </h1>
           <p className={styles.heroDesc}>
             From patient visits to prescription in under <strong>30 seconds</strong>. 
             Automate follow-ups and explore treatment paths with full AI-built for Indian practitioners.
           </p>
           <div className={styles.heroCta}>
             <Link href="/auth?tab=register" className={styles.btnHeroPrimary}>Start 14-Day Free Trial</Link>
             <a href="#demo" className={styles.btnHeroSecondary}>See Live Demo</a>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 40 }}>
             <div style={{ display: 'flex' }}>
                {[1,2,3].map(i => <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#cbd5e1', border: '2px solid white', marginLeft: i > 1 ? -12 : 0 }} />)}
             </div>
             <p style={{ fontSize: 13, color: 'var(--lp-text-muted)', margin: 0 }}>Join 100+ Indian practitioners today</p>
           </div>
        </div>
        <div className={styles.heroImageContainer}>
           <Image 
             src="/assets/medinest_logo.png" 
             alt="Dashboard Preview" 
             width={600} 
             height={400} 
             className={styles.dashboardPreview}
             style={{ opacity: 0.2, filter: 'grayscale(1)' }} // Placeholder until we have actual screenshot
           />
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
             <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--lp-primary)' }}>Doctors Desk Preview</p>
           </div>
        </div>
      </header>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionCenter}>
          <span className={styles.sectionLabel}>Why MediNest?</span>
          <h2 className={styles.sectionTitle}>What makes MediNest different?</h2>
        </div>
        <div className={styles.featuresGrid}>
           <div className={styles.featureCard}>
             <div className={styles.iconBox}>🩺</div>
             <h3>AI-Explainer</h3>
             <p>AI generated summaries in layperson terms so patients actually follow your advice.</p>
           </div>
           <div className={styles.featureCard}>
             <div className={styles.iconBox}>🔄</div>
             <h3>Auto Follow-ups</h3>
             <p>Automatic reminders for next visits. Increase your patient retention by 40%.</p>
           </div>
           <div className={styles.featureCard}>
             <div className={styles.iconBox}>📱</div>
             <h3>WhatsApp Ready</h3>
             <p>Send Rx, bills and reminders directly on WhatsApp. No more lost paper prescriptions.</p>
           </div>
           <div className={styles.featureCard}>
             <div className={styles.iconBox}>🇮🇳</div>
             <h3>Built for India</h3>
             <p>Designed for the fast-paced Indian clinic. Works offline and on mobile effortlessly.</p>
           </div>
        </div>
      </section>

      {/* ── AUTOMATION ── */}
      <section className={`${styles.section} ${styles.automationSection}`}>
         <div className={styles.whatsappMock}>
            <div className={styles.waHeader}>
               <div className={styles.waAvatar}>M</div>
               <div>
                 <p style={{ fontWeight: 800, margin: 0, fontSize: 14 }}>MediNest Assistant</p>
                 <p style={{ margin: 0, fontSize: 11, color: '#22c55e' }}>Online</p>
               </div>
            </div>
            <div className={styles.waBubble}>Hello Dr. Pradeep, 7 patients are scheduled for today. Should I send reminders?</div>
            <div className={`${styles.waBubble} ${styles.waBubbleSelf}`}>Yes, please send them now.</div>
            <div className={styles.waBubble}>Reminders sent to Mrs. Sharma and Mr. Verma. ✅</div>
         </div>
         <div>
            <h2 className={styles.sectionTitle} style={{ fontSize: 40 }}>Let MediNest<br /><span style={{ color: '#6366f1' }}>do the work.</span></h2>
            <p className={styles.heroDesc}>Stop doing repetitive tasks. Our automation handles the heavy lifting while you focus on healing.</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
               {[
                 'Send follow-up reminders automatically.',
                 'Share prescriptions instantly on WhatsApp.',
                 'Explain treatments in simple language using AI.'
               ].map(item => (
                 <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontWeight: 600 }}>
                   <div style={{ color: '#22c55e' }}>✔</div> {item}
                 </li>
               ))}
            </ul>
         </div>
      </section>

      {/* ── VIDEO DEMO ── */}
      <section id="demo" className={styles.videoSection}>
         <h2 className={styles.videoTitle}>See MediNest in action</h2>
         <div className={styles.videoWrapper}>
            <iframe 
               src="https://www.youtube.com/embed/S0Ty4T5vXz4" 
               title="MediNest Demo" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
            ></iframe>
         </div>
         <p style={{ marginTop: 32, fontSize: 18, opacity: 0.8 }}>Watch how to generate a prescription in under 30 seconds.</p>
      </section>

      {/* ── WORKFLOW ── */}
      <section className={styles.section}>
         <div className={styles.sectionCenter}>
           <h2 className={styles.sectionTitle}>From Paper to Digital in 3 Simple Steps</h2>
           <p className={styles.sectionSub}>Modernizing your clinic has never been easier.</p>
         </div>
         <div className={styles.stepGrid}>
            <div className={styles.stepCard}>
               <div className={styles.stepNum}>1</div>
               <h3>Find Patient</h3>
               <p>Search any patient or history without the heavy-lifting.</p>
            </div>
            <div className={styles.stepCard}>
               <div className={styles.stepNum}>2</div>
               <h3>Generate Rx</h3>
               <p>AI-assisted medicine databases and beautiful templates.</p>
            </div>
            <div className={styles.stepCard}>
               <div className={styles.stepNum}>3</div>
               <h3>Print & Share</h3>
               <p>Print on professional letterhead or share directly on WhatsApp.</p>
            </div>
         </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={styles.section}>
         <div className={styles.sectionCenter}>
           <span className={styles.sectionLabel}>Pricing</span>
           <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
           <p className={styles.sectionSub}>Pick the plan that grows with your practice.</p>
         </div>
         <div className={styles.pricingGrid}>
            <div className={styles.priceCard}>
               <p className={styles.priceTitle}>Starter</p>
               <h3 className={styles.priceVal}>₹0 <span>/ month</span></h3>
               <ul className={styles.priceList}>
                 <li>✔ Up to 5 Patients / day</li>
                 <li>✔ Full Patient Records</li>
                 <li>✔ WhatsApp Sharing</li>
               </ul>
               <Link href="/auth" className={`${styles.btnPrice} ${styles.btnPricePrimary}`} style={{ background: '#f1f5f9', color: 'var(--lp-primary)' }}>Get Started Free</Link>
            </div>
            <div className={`${styles.priceCard} ${styles.priceCardPopular}`}>
               <div style={{ position: 'absolute', top: 20, right: 20, background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>RECOMMENDED</div>
               <p className={styles.priceTitle}>Professional</p>
               <h3 className={styles.priceVal}>₹999 <span>/ month</span></h3>
               <ul className={styles.priceList}>
                 <li>✔ Unlimited Prescriptions</li>
                 <li>✔ AI Patient Summaries</li>
                 <li>✔ Automated Follow-up Alerts</li>
                 <li>✔ AI-Analytic Dashboard</li>
               </ul>
               <Link href="/auth" className={`${styles.btnPrice} ${styles.btnPricePrimary}`} style={{ background: 'white', color: 'var(--lp-primary)' }}>Start Free Trial</Link>
            </div>
         </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section} style={{ background: '#fdfaf7' }}>
         <div className={styles.sectionCenter}>
           <h2 className={styles.sectionTitle}>Why doctors love us</h2>
         </div>
         <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {[
              { q: 'Is my patient data safe?', a: 'Yes. We use industry-standard encryption and Supabase row-level security. Only you see your patient data.' },
              { q: 'Will it work if I don\'t have internet?', a: 'Yes. Our offline mode allows you to continue writing prescriptions, which sync when you\'re back online.' },
              { q: 'Does it share on WhatsApp automatically?', a: 'Yes. With just one click, a professional PDF link is sent to the patient via WhatsApp.' }
            ].map((faq, i) => (
              <div key={i} style={{ background: 'white', padding: 24, borderRadius: 16, marginBottom: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ fontWeight: 800, margin: '0 0 8px 0', color: 'var(--lp-primary)' }}>{faq.q}</p>
                <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>{faq.a}</p>
              </div>
            ))}
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
         <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
               <Link href="/" className={styles.navLogo} style={{ marginBottom: 20 }}>
                 <Image src="/assets/medinest_logo.png" alt="MediNest" width={32} height={32} />
                 <span>MediNest</span>
               </Link>
               <p style={{ fontSize: 13, opacity: 0.6 }}>The smarter way to run modern clinics in India. Built with love for practitioners who care.</p>
            </div>
            <div className={styles.footerCol}>
               <h4>Platform</h4>
               <ul><li>Features</li><li>Pricing</li><li>Security</li></ul>
            </div>
            <div className={styles.footerCol}>
               <h4>Company</h4>
               <ul><li>About</li><li>Contact</li><li>Privacy</li></ul>
            </div>
            <div className={styles.footerCol}>
               <h4>Support</h4>
               <ul><li>Help Center</li><li>API Docs</li><li>Status</li></ul>
            </div>
         </div>
         <div style={{ marginTop: 60, textAlign: 'center', opacity: 0.4, fontSize: 12 }}>
           © 2026 MediNest Healthcare. All rights reserved.
         </div>
      </footer>
    </div>
  );
}
