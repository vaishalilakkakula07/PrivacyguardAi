import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Lock, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

const DEMO_SEQUENCES = [
  {
    field: 'Personal Name · NLP/NER',
    raw: 'Rahul Sharma',
    masked: '[REDACTED]',
    technique: 'Complete Masking',
  },
  {
    field: 'Email Address · Regex',
    raw: 'rahul.sharma@gmail.com',
    masked: 'r***********@gmail.com',
    technique: 'Partial Masking',
  },
  {
    field: 'Tax Identifier · Regex',
    raw: 'BNZAA2318J',
    masked: '[PAN_001]',
    technique: 'Token Replacement',
  },
  {
    field: 'Aadhaar Number · Regex',
    raw: '4512 8890 3421',
    masked: 'XXXX XXXX 3421',
    technique: 'Partial Masking',
  },
];

export default function HeroSection({
  onGetStarted,
  onExploreFeatures,
}: HeroSectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % DEMO_SEQUENCES.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const currentSample = DEMO_SEQUENCES[activeIdx];

  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-slate-200 bg-white cyber-grid-bg"
    >
      {/* Subtle soft emerald radial highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 lg:px-8 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Primary Proposition & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700">
              <span>Cyber Security</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Digital Privacy</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500">Online Safety</span>
            </div>

            <h1
              className="font-display font-bold tracking-tight text-slate-950"
              style={{
                fontSize: 'clamp(2.35rem, 4.2vw, 3.75rem)',
                lineHeight: 1.08,
                textWrap: 'balance',
              }}
            >
              PrivacyGuardAI
            </h1>

            <p className="mt-3 font-display text-xl font-medium tracking-tight text-emerald-700 sm:text-2xl">
              &ldquo;Your Data. Your Privacy. Our Intelligence.&rdquo;
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-[17px]">
              An intelligent AI-powered platform that detects sensitive personal
              information, anonymizes private data, and enables safer data
              sharing across healthcare, banking, research, and enterprise
              workflows.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onExploreFeatures}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Compass className="h-4 w-4 text-emerald-600" />
                <span>Explore Features</span>
              </button>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              AI-Powered Data Anonymization and Privacy Protection System ·
              Ephemeral in-memory scanning with zero permanent storage of
              uploaded data.
            </p>
          </motion.div>

          {/* Right Column: Visual Cybersecurity Vault + Live Animated Inspection Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_privacy_vault_1795625430667.jpg"
                  alt="PrivacyGuard AI isometric cybersecurity data protection vault illustration"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover lg:min-h-[390px]"
                />
              ) : (
                <div className="flex h-full min-h-[390px] w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                  <ShieldCheck className="h-24 w-24 text-emerald-500/50" />
                </div>
              )}

              {/* Subtle scrim for card legibility */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent"
              />

              {/* Frosted White & Emerald Inspection Card */}
              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-emerald-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Automated PII Inspection Preview</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {currentSample.technique}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Detected ({currentSample.field})
                    </div>
                    <div className="mt-1 font-mono text-sm font-medium text-rose-700 tabular-nums">
                      {currentSample.raw}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Lock className="h-3 w-3 text-emerald-600" />
                      <span>Protected Output</span>
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                      {currentSample.masked}
                    </div>
                  </div>
                </div>

                {/* Progress Indicator Bars */}
                <div className="mt-3 flex gap-1.5" aria-hidden="true">
                  {DEMO_SEQUENCES.map((seq, idx) => (
                    <button
                      key={seq.field}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      aria-label={`Preview ${seq.field}`}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 cursor-pointer ${
                        idx === activeIdx ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Architectural Protection Metrics Strip */}
        <div className="mt-12 grid grid-cols-1 divide-y divide-emerald-200/70 rounded-xl border border-emerald-200 bg-emerald-50/45 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
          <div className="p-5">
            <div className="font-mono text-2xl font-semibold text-slate-950 tabular-nums">
              7 Categories
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-700">
              Hybrid NLP/NER + Regex
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Detects names via Compromise NER plus emails, phones, Aadhaar, PAN, IPs, and custom terms.
            </p>
          </div>
          <div className="p-5">
            <div className="font-mono text-2xl font-semibold text-slate-950 tabular-nums">
              4 Techniques
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-700">
              Configurable Masking
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Complete redaction, partial masking, indexed token replacement, and user-defined labels.
            </p>
          </div>
          <div className="p-5">
            <div className="font-mono text-2xl font-semibold text-slate-950 tabular-nums">
              0 Bytes Stored
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-700">
              Ephemeral In-Memory Engine
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Uploaded CSV and TXT records are processed transiently in RAM without database persistence.
            </p>
          </div>
          <div className="p-5">
            <div className="font-mono text-2xl font-semibold text-slate-950 tabular-nums">
              CSV · TXT · Audit
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-700">
              Verified Export Formats
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Compare original vs protected data side by side and export clean datasets with risk reports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
