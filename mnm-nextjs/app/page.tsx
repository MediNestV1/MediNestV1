import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
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
            <a href="#features" className={styles.btnHeroSecondary}>See Features ↓</a>
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
