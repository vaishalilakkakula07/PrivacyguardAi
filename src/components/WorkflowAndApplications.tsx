import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle,
  Download,
  FileSearch,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Landmark,
  Shield,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Upload or Enter Data',
    description:
      'Import CSV spreadsheets, TXT logs, or paste unstructured text directly into the ephemeral workspace.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'AI Scans the Data',
    description:
      'Compromise NLP/NER and deterministic regex engines inspect every sentence and table cell in memory.',
    icon: Activity,
  },
  {
    step: '03',
    title: 'Sensitive Info Identified',
    description:
      'Personal names, emails, mobile numbers, Aadhaar, PAN, IP addresses, and custom terms are classified.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Data Anonymized',
    description:
      'Selected complete, partial, indexed token, or custom replacement masking is applied consistently.',
    icon: SlidersHorizontal,
  },
  {
    step: '05',
    title: 'Protected Data Verified',
    description:
      'Side-by-side diff previews and before/after exposure risk charts validate reduction before export.',
    icon: CheckCircle,
  },
  {
    step: '06',
    title: 'Download Output',
    description:
      'Export sanitized CSV or TXT files alongside an educational Privacy Analysis Report.',
    icon: Download,
  },
];

const APPLICATIONS = [
  {
    sector: 'Healthcare',
    title: 'Protect Patient Records & Medical Reports',
    description:
      'Mask patient names, contact details, and national IDs in clinical intake logs before sharing datasets for medical research.',
    icon: HeartPulse,
  },
  {
    sector: 'Banking',
    title: 'Secure Customer Details & Financial Transactions',
    description:
      'Redact PAN numbers, Aadhaar references, and customer phone numbers in KYC escalations and support transcripts.',
    icon: Landmark,
  },
  {
    sector: 'Government',
    title: 'Protect Citizens’ Personal Information',
    description:
      'Sanitize public grievance logs and municipal records prior to inter-departmental reporting or open-data publication.',
    icon: Shield,
  },
  {
    sector: 'Education',
    title: 'Protect Student Information',
    description:
      'Anonymize university enrollment spreadsheets, survey responses, and campus lab logs while retaining cohort structure.',
    icon: GraduationCap,
  },
  {
    sector: 'Research',
    title: 'Enable Privacy-Conscious Data Analysis',
    description:
      'Replace direct identifiers with deterministic tokens like [NAME_001] so statistical correlations remain intact.',
    icon: FlaskConical,
  },
  {
    sector: 'Businesses',
    title: 'Protect Confidential Customer Information',
    description:
      'Strip sensitive customer PII and internal project keywords before feeding operational logs into analytics pipelines.',
    icon: Building2,
  },
];

export default function WorkflowAndApplications() {
  return (
    <>
      {/* How It Works Section */}
      <section
        id="workflow"
        className="border-b border-slate-200 bg-white py-16 lg:py-22"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              How It Works · End-to-End Privacy Pipeline
            </p>
            <h2
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Six-Stage Automated Anonymization Workflow
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Every dataset moves through a deterministic, verifiable pipeline
              from ingestion to protected download without leaving volatile
              memory.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.35,
                    delay: idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-6 transition-colors duration-150 hover:border-emerald-300 hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                        <span>STEP {item.step}</span>
                        {idx < WORKFLOW_STEPS.length - 1 && (
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real-World Applications Section */}
      <section
        id="applications"
        className="border-b border-slate-200 bg-slate-50/75 py-16 lg:py-22"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Real-World Applications
            </p>
            <h2
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Built for Sensitive Data Workflows Across Six Core Sectors
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              PrivacyGuard AI bridges the gap between strict data-protection
              requirements and practical analytics across regulated industries.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {APPLICATIONS.map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.sector}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-colors duration-150 hover:border-emerald-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                      {app.sector}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-slate-950">
                    {app.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {app.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
