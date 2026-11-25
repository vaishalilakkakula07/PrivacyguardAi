interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const links = [
    { label: 'Home', target: 'home' },
    { label: 'About', target: 'about' },
    { label: 'Workspace', target: 'workspace' },
    { label: 'Risk Analytics', target: 'analytics' },
    { label: 'How It Works', target: 'workflow' },
    { label: 'Technology', target: 'technology' },
    { label: 'References', target: 'references' },
  ];

  return (
    <footer className="bg-white py-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-slate-200 pb-10 md:grid-cols-12">
          {/* Branding & Description */}
          <div className="md:col-span-5">
            <div className="font-display text-lg font-bold text-slate-950">
              PrivacyGuard AI
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              &ldquo;Your Data. Your Privacy. Our Intelligence.&rdquo;
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-600">
              AI-Powered Data Anonymization and Privacy Protection System.
              Processes sensitive data ephemerally in memory with zero permanent
              retention.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">
              Platform Navigation
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {links.map((link) => (
                <li key={link.target}>
                  <a
                    href={`#${link.target}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.target);
                    }}
                    className="transition-colors hover:text-emerald-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Privacy Notice */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">
              Security & Privacy Architecture
            </h3>
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900">
                Ephemeral In-Memory Processing
              </p>
              <p>Zero database persistence or raw PII server logging.</p>
              <p>
                Risk scores are educational heuristics and do not constitute
                certified privacy or legal compliance guarantees.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            &copy; 2026 PrivacyGuard AI. Educational privacy protection
            platform.
          </p>
          <p>Do not submit real confidential records to public demos.</p>
        </div>
      </div>
    </footer>
  );
}
