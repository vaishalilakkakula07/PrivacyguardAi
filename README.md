# PrivacyGuard AI

**AI-Powered Data Anonymization and Privacy Protection System**

> *"Your Data. Your Privacy. Our Intelligence."*

PrivacyGuard AI is a full-stack web application that detects sensitive personal information in unstructured text and structured CSV datasets, applies configurable anonymization techniques strictly in ephemeral memory, visualizes exposure metrics, and generates sanitized outputs for safer data sharing.

---

## Key Features

- **Hybrid PII Detection (`NLP/NER` + `Regex` + `Custom Rules`)**
  - **Personal Names (NLP/NER):** Powered by `compromise` Named Entity Recognition combined with contextual name heuristics.
  - **Structured Identifiers (Regex):** Detects Email addresses, Mobile numbers (Indian `+91` / 10-digit and international formats), 12-digit Aadhaar numbers, PAN numbers (`[A-Z]{5}[0-9]{4}[A-Z]`), and IPv4 / IPv6 addresses.
  - **Custom Sensitive Terms:** Dynamically add or remove user-defined terms and phrases to mask alongside standard identifiers.
- **Four Anonymization Techniques**
  - **Complete Masking:** `Rahul Sharma` → `[REDACTED]`
  - **Partial Masking:** `rahul@gmail.com` → `r****@gmail.com`
  - **Indexed Token Replacement:** `rahul@gmail.com` → `[EMAIL_001]` (preserves record linkage across datasets)
  - **Custom Replacement:** User-defined replacement labels per sensitive category
- **Dynamic CSV & TXT Workspace**
  - Drag-and-drop or browse `.csv` and `.txt` files (up to 2 MB, with UTF-8 BOM stripping and `,`, `;`, `\t`, `|` delimiter auto-detection), or paste data manually.
  - Side-by-side comparison showing highlighted PII spans in original text, interactive CSV Table Diffs, and live protected output.
  - Includes synthetic sample datasets (Healthcare CSV, Banking KYC TXT, Academic Research CSV) for immediate evaluation.
- **Interactive Privacy Risk Analytics**
  - Real-time entity counts by category and detection engine (`NLP/NER` vs `Regex` vs `Custom Rule`).
  - Interactive charts (category distribution, before-vs-after exposure comparison, and engine split) plus a searchable, filterable entity audit table.
  - Educational before/after privacy risk scores clearly labeled as heuristic estimates rather than certified compliance guarantees.
- **Secure Output & Export**
  - Download anonymized `.csv` and `.txt` files.
  - Preview and download a formatted Privacy Analysis Report.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons, Recharts
- **NLP & Data Processing:** `compromise` (NLP/NER), `papaparse` (RFC-4180 CSV parsing & serialization)
- **Backend:** Node.js, Express (stateless in-memory `/api/anonymize` and `/api/health` endpoints)

---

## Project Structure

```text
├── index.html
├── metadata.json
├── package.json
├── server.ts                         # Express server & ephemeral /api/anonymize endpoint
├── vite.config.ts
└── src/
    ├── App.tsx                       # Integrated application state & download handlers
    ├── index.css                     # Tailwind CSS v4 theme & typography setup
    ├── data/
    │   └── samples.ts                # Synthetic sample datasets (CSV & TXT)
    ├── engine/
    │   ├── types.ts                  # TypeScript interfaces for scans & risk metrics
    │   └── anonymizer.ts             # Hybrid NLP/NER + Regex + CSV anonymization engine
    └── components/
        ├── Navbar.tsx
        ├── HeroSection.tsx
        ├── AboutSection.tsx
        ├── WorkspaceSection.tsx
        ├── AnalyticsDashboard.tsx
        ├── WorkflowAndApplications.tsx
        ├── TechImpactTeamRefs.tsx
        ├── PrivacyReportModal.tsx
        └── Footer.tsx
```

---

## Getting Started

### Prerequisites

- Node.js `v22+`
- npm

### Installation

```bash
npm install
```

### Run in Development

Starts the Express backend and Vite dev middleware on port `3000`:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Typecheck & Production Build

```bash
npm run lint
npm run build
npm start
```

---

## API Endpoints

- `GET /api/health` — Returns service health and confirms zero-persistence mode.
- `POST /api/anonymize` — Accepts `{ input, options }` JSON payload, performs in-memory NLP/NER and regex anonymization, and returns anonymized output, entity audit metadata, CSV table diff data, and educational risk metrics without persisting or logging raw data.

---

## Security & Privacy Notice

- **Zero Persistent Storage:** Uploaded files and pasted text are processed strictly in volatile memory and are never saved to a database or logged to server output.
- **Public Demo Caution:** Do not upload real confidential patient, banking, government, or personal records to a public demo instance.
- **Detection Limitations:** Automated NLP/NER and pattern-matching pipelines substantially reduce direct identifier exposure, but cannot guarantee 100% anonymity against unusual names, spelling variations, or indirect quasi-identifiers. Risk scores are educational estimates only and do not represent certified legal or security guarantees.

---

## Research & References

- **NIST (2025)** – *Guidelines for Evaluating Differential Privacy Guarantees.*
- **Cynthia Dwork and Aaron Roth (2014)** – *The Algorithmic Foundations of Differential Privacy.*

---

## License

Licensed under the Apache-2.0 License.
