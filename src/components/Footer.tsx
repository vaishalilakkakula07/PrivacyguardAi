interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const links = [
    { label: 'Home', target: 'home' },
    { label: 'Workspace', target: 'workspace' },
    { label: 'Risk Analytics', target: 'analytics' },
  ];

  return (
    <footer className="bg-white py-8 text-slate-600">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <span className="font-display text-sm font-bold text-slate-950">
            PrivacyGuardAI
          </span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-xs text-slate-500">
            Ephemeral in-memory anonymization · Zero data retention
          </span>
        </div>

        <nav className="flex items-center gap-5 text-xs font-medium">
          {links.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(link.target);
              }}
              className="text-slate-600 transition-colors hover:text-emerald-700"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
