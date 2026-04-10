'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { user, clinic, loading } = useClinic();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      console.log('🌐 Landing: Initiating Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('❌ Landing: Google error:', err);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 Landing: User identified, redirecting based on clinic status...');
      if (!clinic) {
        router.push('/onboarding');
      } else if (clinic.status === 'active') {
        router.push('/portal');
      } else if (clinic.status === 'pending') {
        router.push('/pending');
      }
    }
  }, [user, clinic, loading, router]);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'white' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.navLogoIcon}>
            <Image src="/assets/medinest_logo.png" alt="MediNest" width={38} height={38} style={{ objectFit: 'contain' }} />
          </div>
          <span className={styles.navLogoText}>MediNest</span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>

        <div className={styles.navCta}>
          <Link href="/auth?tab=login" className={styles.btnOutlineNav}>Log In</Link>
          <Link href="/auth?tab=register" className={styles.btnSolidNav}>Get Started Free →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <div className={styles.dot} />
            Now serving 100+ clinics across India
          </div>
          <h1 className={styles.heroH1}>
            The smartest way to<br />run your <span>clinic</span>
          </h1>
          <p className={styles.heroDesc}>
            Prescriptions, billing, patient records, and analytics — all in one beautiful platform designed for Indian healthcare.
          </p>
          <div className={styles.heroCta}>
            <Link href="/auth?tab=register" className={styles.btnHeroPrimary}>🚀 Start Free Trial</Link>
            <button onClick={handleGoogleLogin} className={styles.btnHeroGoogle}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.num}>100+</div>
              <div className={styles.lbl}>Clinics Onboarded</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.num}>50K+</div>
              <div className={styles.lbl}>Prescriptions Generated</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.num}>99.9%</div>
              <div className={styles.lbl}>Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionLabel}>Everything You Need</div>
        <h2 className={styles.sectionTitle}>Built for real clinics</h2>
        <p className={styles.sectionSub}>Every feature your clinic team needs, designed for speed and simplicity.</p>
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: f.bg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={styles.section}>
        <div className={styles.sectionLabel}>Pricing</div>
        <h2 className={styles.sectionTitle}>Simple, honest pricing</h2>
        <p className={styles.sectionSub}>Start free, scale as you grow.</p>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3>Starter</h3>
            <div className={styles.price}>₹0 <span>/ forever</span></div>
            <ul>
              <li>5 Prescriptions/day</li>
              <li>Basic Billing</li>
              <li>1 Doctor profile</li>
              <li>Email Support</li>
            </ul>
            <Link href="/auth?tab=register" className={`${styles.btnPrice} ${styles.btnPriceOutline}`}>Get Started Free</Link>
          </div>
          <div className={`${styles.priceCard} ${styles.priceCardFeatured}`}>
            <div className={styles.priceBadge}>Most Popular</div>
            <h3>Professional</h3>
            <div className={styles.price}>₹999 <span>/ month</span></div>
            <ul>
              <li>Unlimited Prescriptions</li>
              <li>Full Billing Suite</li>
              <li>Up to 10 Doctors</li>
              <li>Revenue Analytics</li>
              <li>Discharge Summaries</li>
              <li>Priority Support</li>
            </ul>
            <Link href="/auth?tab=register" className={`${styles.btnPrice} ${styles.btnPriceSolid}`}>Start Free Trial</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2>Ready to modernize<br />your clinic?</h2>
        <p>Join hundreds of clinics already using MediNest every day</p>
        <Link href="/auth?tab=register" className={styles.btnCtaWhite}>Create Free Account →</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <strong>MediNest</strong> · Clinic Management Platform · © 2026 All Rights Reserved
      </footer>
    </div>
  );
}

const features = [
  { icon: '📋', title: 'Smart Prescriptions', desc: 'Generate professional digital prescriptions in seconds. Auto-save to patient records.', bg: '#e6f4f2' },
  { icon: '🧾', title: 'One-Click Billing', desc: 'Print medical receipts instantly. Services, fees, and payment modes all in one place.', bg: '#eff6ff' },
  { icon: '👤', title: 'Patient History', desc: 'Search any patient by name or phone. View full medical timeline and past prescriptions.', bg: '#f5f3ff' },
  { icon: '📊', title: 'Revenue Analytics', desc: 'Daily, weekly, and monthly reports. Track OPD vs IPD, doctor-wise performance.', bg: '#fef9c3' },
  { icon: '📄', title: 'Discharge Summary', desc: 'Generate professional discharge summaries with diagnosis and medication history.', bg: '#fef2f2' },
  { icon: '🔐', title: 'Secure & Private', desc: 'Each clinic sees only its own data. Row-level security powered by Supabase.', bg: '#f0fdf4' },
];
