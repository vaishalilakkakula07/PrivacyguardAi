import { Download, FileCheck2, X } from 'lucide-react';
import { buildPrivacyAnalysisReport } from '../engine/anonymizer.ts';
import type { ScanResult } from '../engine/types.ts';

interface PrivacyReportModalProps {
  scanResult: ScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadReport: () => void;
}

export default function PrivacyReportModal({
  scanResult,
  isOpen,
  onClose,
  onDownloadReport,
}: PrivacyReportModalProps) {
  if (!isOpen || !scanResult) return null;

  const reportText = buildPrivacyAnalysisReport(scanResult);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
            <h3
              id="privacy-report-title"
              className="font-display text-base font-semibold text-slate-950"
            >
              Generated Privacy Analysis Report
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy report"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800">
            {reportText}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <span className="text-xs text-slate-500">
            Generated ephemerally in memory · Educational estimate only
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onDownloadReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Report (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
