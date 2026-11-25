import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Shield } from 'lucide-react';

const PROBLEMS_ADDRESSED = [
  {
    index: '01',
    title: 'Data Leakage and Privacy Violations',
    detail:
      'Unmasked exports of healthcare, banking, and academic spreadsheets expose direct identifiers when shared with third-party analysts or cloud tools.',
  },
  {
    index: '02',
    title: 'Difficulty in Manually Hiding Personal Information',
    detail:
      'Manual find-and-replace across thousands of CSV cells and unstructured notes is slow, inconsistent, and prone to human oversight.',
  },
  {
    index: '03',
    title: 'Weaknesses in Traditional Protection Techniques',
    detail:
      'Basic rule-only scripts miss contextual personal names in prose, while rigid column deletion destroys analytical utility.',
  },
  {
    index: '04',
    title: 'Lack of Secure Data-Sharing Methods',
    detail:
      'Teams need repeatable anonymization modes—redaction, partial masking, and consistent tokens—paired with verifiable risk visibility.',
  },
];

const INNOVATIONS = [
  'Combines contextual NLP/NER person recognition with deterministic regular-expression matching for structured Indian and global identifiers.',
  'Preserves analytical structure across multi-column CSV files via consistent indexed tokens such as [EMAIL_001] and [NAME_001].',
  'Computes transparent before-and-after educational exposure scores so teams can verify protection before exporting.',
  'Operates strictly in ephemeral memory without writing sensitive payloads to disk or external telemetry logs.',
];

export default function AboutSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="about"
      className="border-b border-slate-200 bg-slate-50/75 py-16 lg:py-22"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            About the Project · Cyber Security, Digital Privacy & Online Safety
          </p>
          <h2
            className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Automated Protection Against Unintentional PII Exposure
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Large amounts of personal information are collected daily across
            hospitals, financial institutions, universities, and digital
            platforms—increasing the risk of data breaches, privacy violations,
            and identity theft whenever datasets are shared or analyzed.
          </p>
        </div>

        {/* Main Split: Problem Statement Grid + Pipeline Render & Solution */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          {/* Left: 4 Problems Addressed */}
          <div className="lg:col-span-7">
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Core Privacy Challenges Addressed
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PROBLEMS_ADDRESSED.map((item) => (
                <div
                  key={item.index}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-colors duration-150 hover:border-emerald-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                      {item.index}.
                    </span>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="mt-3 font-display text-base font-semibold text-slate-950">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Proposed Solution + Technical Render */}
          <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-white p-6 lg:col-span-5">
            <div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                {!imgError ? (
                  <img
                    src="/src/assets/images/data_anonymization_core_1795625431891.jpg"
                    alt="PrivacyGuard AI encrypted data anonymization prism pipeline"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
                    <Cpu className="h-12 w-12 text-emerald-600/60" />
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Shield className="h-4 w-4" />
                <span>Proposed Solution & Innovation</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                PrivacyGuard AI is an automated AI-powered system that scans
                unstructured text and structured CSV datasets, identifies
                sensitive personal details through hybrid NLP/NER and pattern
                detection, and replaces them using configurable anonymization
                techniques.
              </p>

              <ul className="mt-4 space-y-2.5">
                {INNOVATIONS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
