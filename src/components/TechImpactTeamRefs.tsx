import {
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileCode2,
  FlaskConical,
  Layers,
  Terminal,
} from 'lucide-react';

const ACADEMIC_STACK = [
  {
    name: 'Python',
    role: 'Main Programming Language',
    detail: 'Core prototype language for NLP pipelines and privacy scoring experiments.',
    icon: Code2,
  },
  {
    name: 'Pandas',
    role: 'Data Handling & Analysis',
    detail: 'Structured DataFrame manipulation for multi-column CSV sanitization.',
    icon: Layers,
  },
  {
    name: 'MySQL',
    role: 'Database Management',
    detail: 'Relational metadata modeling for enterprise policy and audit schemas.',
    icon: Database,
  },
  {
    name: 'Google Colab',
    role: 'Development & Testing',
    detail: 'Interactive notebook experimentation and benchmark dataset validation.',
    icon: FlaskConical,
  },
  {
    name: 'Streamlit',
    role: 'Python Web Application Interface',
    detail: 'Rapid Python prototype UI complemented by this React + Express web platform.',
    icon: Terminal,
  },
  {
    name: 'NLP / NER',
    role: 'Sensitive Entity Recognition',
    detail: 'Person-name extraction via Compromise NER paired with precision regex rules.',
    icon: Cpu,
  },
];

const IMPACT_POINTS = [
  {
    title: 'Improved Personal Data Privacy',
    detail:
      'Detects and conceals direct personal identifiers before files leave internal environments.',
  },
  {
    title: 'Reduced Exposure of Sensitive Information',
    detail:
      'Eliminates raw Aadhaar, PAN, phone, and email exposure in shared exports and analytical notebooks.',
  },
  {
    title: 'Safer Data-Sharing Workflows',
    detail:
      'Consistent token replacement enables cross-organization collaboration without leaking raw customer identities.',
  },
  {
    title: 'Reduced Manual Anonymization Effort',
    detail:
      'Automates repetitive CSV and prose redaction in milliseconds instead of error-prone manual editing.',
  },
  {
    title: 'Increased Awareness of Cybersecurity',
    detail:
      'Interactive risk-score breakdowns educate users on why unmasked identifiers create severe exposure.',
  },
];

const REFERENCES = [
  {
    citation:
      'NIST (2025) – Guidelines for Evaluating Differential Privacy Guarantees.',
    relevance:
      'Establishes rigorous criteria for evaluating privacy budgets, re-identification bounds, and clear disclosure of privacy guarantees versus heuristic masking—informing our transparent risk-score disclaimers and limitations model.',
  },
  {
    citation:
      'Cynthia Dwork and Aaron Roth (2014) – The Algorithmic Foundations of Differential Privacy.',
    relevance:
      'Provides the formal mathematical foundation explaining why naive redaction alone cannot guarantee absolute anonymity against linkage attacks, motivating our distinction between direct PII masking and formal differential privacy.',
  },
];

export default function TechImpactTeamRefs() {
  return (
    <>
      {/* Technology & Project Impact */}
      <section
        id="technology"
        className="border-b border-slate-200 bg-white py-16 lg:py-22"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left: Technology Stack & Live Web Architecture */}
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                Technology & Innovation
              </p>
              <h2
                className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950"
                style={{ textWrap: 'balance' }}
              >
                Architecture & Live Web Runtime
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Designed around a Python data-science stack for research
                prototyping and implemented here as a zero-persistence
                TypeScript, React, Express, and Compromise NLP/NER web platform
                requiring zero paid APIs.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {ACADEMIC_STACK.map((tech) => {
                  const Icon = tech.icon;
                  return (
                    <div
                      key={tech.name}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-display text-sm font-semibold text-slate-950">
                            {tech.name}
                          </div>
                          <div className="text-[11px] font-medium text-emerald-700">
                            {tech.role}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                        {tech.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs leading-relaxed text-slate-700">
                <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  <strong className="text-slate-950">Live Browser & Express Execution:</strong>{' '}
                  This web application executes real Compromise NLP/NER,
                  PapaParse RFC-4180 CSV parsing, and deterministic regex
                  anonymization in TypeScript via Node/Express in-memory APIs.
                </span>
              </div>
            </div>

            {/* Right: Project Impact */}
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                Project Impact
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
                Measurable Privacy Outcomes
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Empowering researchers, analysts, and organizations to adopt
                privacy-by-design habits before datasets are shared.
              </p>

              <div className="mt-6 space-y-3">
                {IMPACT_POINTS.map((point) => (
                  <div
                    key={point.title}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research & References */}
      <section
        id="references"
        className="border-b border-slate-200 bg-slate-50/75 py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              <BookOpen className="h-4 w-4" />
              <span>Research & Academic Foundation</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              Cited Standards & Privacy Literature
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Our methodology grounds practical PII masking and educational risk
              estimation in established differential privacy research and
              evaluation standards.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {REFERENCES.map((ref) => (
              <article
                key={ref.citation}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="font-display text-base font-semibold text-emerald-800">
                  {ref.citation}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {ref.relevance}
                </p>
              </article>
            ))}
          </div>

          {/* Call-to-Action Block */}
          <div className="mt-14 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white p-8 sm:p-10">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  Ready to Test PrivacyGuard AI
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Inspect Sensitive Data and Anonymize Records in Seconds
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Load one of our synthetic healthcare, banking, or academic
                  datasets, compare all four masking modes side by side, and
                  download your sanitized CSV or TXT output.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="#workspace"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('workspace')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                >
                  Open Anonymization Workspace
                </a>
                <a
                  href="#analytics"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('analytics')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap"
                >
                  View Risk Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
