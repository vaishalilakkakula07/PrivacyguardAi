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
    masked: '[NAME_001]',
    technique: 'Token Replacement',
  },
  {
    field: 'Email Address · Regex',
    raw: 'rahul.sharma@gmail.com',
    masked: 'r***********@gmail.com',
    technique: 'Partial Masking',
  },
  {
    field: 'Password · Regex',
    raw: 'BankVault#4920',
    masked: '[REDACTED]',
    technique: 'Complete Masking',
  },
  {
    field: 'Mobile Number · Regex',
    raw: '+91 9848012345',
    masked: '+91 ●●●●●●●●45',
    technique: 'Partial Masking',
  },
  {
    field: 'Tax Identifier · Regex',
    raw: 'BNZAA2318J',
    masked: '[ID_TAX_PAN]',
    technique: 'Custom Label',
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Primary Proposition & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <h1
              className="font-display font-bold tracking-tight text-slate-950"
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                lineHeight: 1.08,
                textWrap: 'balance',
              }}
            >
              PrivacyGuardAI
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Detect and mask sensitive personal data—names, emails, mobile
              numbers, passwords, Aadhaar, PAN, and IP addresses—in CSV or text
              records with per-category rules and ephemeral in-memory execution.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <span>Start Anonymizing</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onExploreFeatures}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Compass className="h-4 w-4 text-emerald-600" />
                <span>Risk Analytics</span>
              </button>
            </div>
          </motion.div>

          {/* Right Column: Visual Cybersecurity Vault + Live Animated Inspection Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="relative h-full min-h-[290px] overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_privacy_vault_1795625430667.jpg"
                  alt="PrivacyGuardAI cybersecurity data protection illustration"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full max-h-[320px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[290px] w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                  <ShieldCheck className="h-20 w-20 text-emerald-500/50" />
                </div>
              )}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent"
              />

              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-emerald-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Live Per-Category Masking Preview</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {currentSample.technique}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      {currentSample.field}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-medium text-rose-700 tabular-nums">
                      {currentSample.raw}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Lock className="h-3 w-3 text-emerald-600" />
                      <span>Masked Output</span>
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                      {currentSample.masked}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
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
      </div>
    </section>
  );
}
