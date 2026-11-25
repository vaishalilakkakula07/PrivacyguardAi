import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  Plus,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CATEGORY_META } from '../engine/anonymizer.ts';
import type {
  AnonymizationTechnique,
  CustomLabelMap,
  DetectedEntity,
  DetectionCategory,
  InputFormat,
  ScanResult,
} from '../engine/types.ts';
import { SAMPLE_DATASETS } from '../data/samples.ts';

interface WorkspaceSectionProps {
  inputText: string;
  onInputTextChange: (val: string) => void;
  onUploadFile: (content: string, detectedFormat: InputFormat, fileName: string) => void;
  onClearWorkspace: () => void;
  activeSourceLabel: string;
  format: InputFormat;
  onFormatChange: (fmt: InputFormat) => void;
  categories: Record<DetectionCategory, boolean>;
  onToggleCategory: (cat: DetectionCategory) => void;
  technique: AnonymizationTechnique;
  onTechniqueChange: (tech: AnonymizationTechnique) => void;
  customTerms: string[];
  onAddCustomTerm: (term: string) => void;
  onRemoveCustomTerm: (term: string) => void;
  customLabels: CustomLabelMap;
  onCustomLabelChange: (cat: DetectionCategory, val: string) => void;
  onRunScan: () => void;
  isScanning: boolean;
  scanResult: ScanResult | null;
  onLoadSample: (sampleId: string) => void;
  onDownloadCsv: () => void;
  onDownloadTxt: () => void;
  onDownloadReport: () => void;
}

const TECHNIQUE_OPTIONS: {
  id: AnonymizationTechnique;
  title: string;
  example: string;
  description: string;
}[] = [
  {
    id: 'complete',
    title: 'Complete Masking',
    example: 'Rahul Sharma → [REDACTED]',
    description: 'Replaces every detected sensitive span with a uniform redaction marker.',
  },
  {
    id: 'partial',
    title: 'Partial Masking',
    example: 'rahul@gmail.com → r****@gmail.com',
    description: 'Retains non-sensitive structural cues while masking core identifying characters.',
  },
  {
    id: 'replacement',
    title: 'Replacement',
    example: 'rahul@gmail.com → [EMAIL_001]',
    description: 'Assigns deterministic indexed tokens so linked records stay analytically consistent.',
  },
  {
    id: 'custom',
    title: 'Custom Replacement',
    example: 'User-defined category labels',
    description: 'Applies your own custom replacement tags for each sensitive category.',
  },
];

const CATEGORY_ORDER: DetectionCategory[] = [
  'name',
  'email',
  'mobile',
  'aadhaar',
  'pan',
  'ip',
  'custom',
];

const HIGHLIGHT_STYLE: Record<DetectionCategory, string> = {
  name: 'bg-emerald-100 text-emerald-950 border-b-2 border-emerald-600',
  email: 'bg-teal-100 text-teal-950 border-b-2 border-teal-600',
  mobile: 'bg-lime-100 text-lime-950 border-b-2 border-lime-600',
  aadhaar: 'bg-amber-100 text-amber-950 border-b-2 border-amber-600',
  pan: 'bg-rose-100 text-rose-950 border-b-2 border-rose-600',
  ip: 'bg-sky-100 text-sky-950 border-b-2 border-sky-600',
  custom: 'bg-green-100 text-green-950 border-b-2 border-green-700',
};

function HighlightedOriginalText({
  text,
  entities,
  onSelectEntity,
  selectedEntityId,
}: {
  text: string;
  entities: DetectedEntity[];
  onSelectEntity: (entity: DetectedEntity) => void;
  selectedEntityId: string | null;
}) {
  if (!entities.length) {
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-700">
        {text}
      </pre>
    );
  }

  const textEntities = entities
    .filter((e) => e.rowIndex === undefined)
    .sort((a, b) => a.start - b.start);

  if (textEntities.length === 0) {
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-700">
        {text}
      </pre>
    );
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  textEntities.forEach((ent, idx) => {
    if (ent.start > cursor) {
      segments.push(
        <span key={`plain-${idx}`}>{text.slice(cursor, ent.start)}</span>
      );
    }
    const isSelected = selectedEntityId === ent.id;
    segments.push(
      <button
        key={ent.id}
        type="button"
        onClick={() => onSelectEntity(ent)}
        title={`${CATEGORY_META[ent.category].label} (${ent.engineMethod}) → ${ent.anonymized}`}
        className={`inline rounded px-1 py-0.5 font-mono text-xs transition-colors cursor-pointer ${
          HIGHLIGHT_STYLE[ent.category]
        } ${isSelected ? 'ring-2 ring-emerald-700' : 'hover:brightness-95'}`}
      >
        {text.slice(ent.start, ent.end)}
      </button>
    );
    cursor = ent.end;
  });

  if (cursor < text.length) {
    segments.push(<span key="plain-tail">{text.slice(cursor)}</span>);
  }

  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-700">
      {segments}
    </pre>
  );
}

export default function WorkspaceSection({
  inputText,
  onInputTextChange,
  onUploadFile,
  onClearWorkspace,
  activeSourceLabel,
  format,
  onFormatChange,
  categories,
  onToggleCategory,
  technique,
  onTechniqueChange,
  customTerms,
  onAddCustomTerm,
  onRemoveCustomTerm,
  customLabels,
  onCustomLabelChange,
  onRunScan,
  isScanning,
  scanResult,
  onLoadSample,
  onDownloadCsv,
  onDownloadTxt,
  onDownloadReport,
}: WorkspaceSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newTerm, setNewTerm] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'raw' | 'table'>(
    format === 'csv' ? 'table' : 'raw'
  );
  const [compareViewMode, setCompareViewMode] = useState<'text' | 'csv-table'>(
    format === 'csv' ? 'csv-table' : 'text'
  );
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<DetectedEntity | null>(null);

  // Automatically sync comparison table view whenever a CSV scan result arrives
  useEffect(() => {
    if (scanResult?.csvComparison) {
      setCompareViewMode('csv-table');
    } else {
      setCompareViewMode('text');
    }
    setSelectedEntity(null);
  }, [scanResult?.csvComparison, scanResult?.originalText]);

  // Sync preview mode when switching between CSV and TXT
  useEffect(() => {
    setPreviewMode(format === 'csv' ? 'table' : 'raw');
  }, [format]);

  const parsedInputPreview = useMemo(() => {
    if (format !== 'csv' || !inputText.trim()) return null;
    const clean = inputText.replace(/^\uFEFF/, '').trim();
    const parsed = Papa.parse<string[]>(clean, {
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|'],
    });
    if (parsed.data.length < 2) return null;
    return {
      headers: parsed.data[0],
      rows: parsed.data.slice(1, 101),
      totalRows: parsed.data.length - 1,
    };
  }, [format, inputText]);

  const handleFileValidationAndRead = (file: File) => {
    setUploadError(null);
    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith('.csv');
    const isTxt = lowerName.endsWith('.txt');

    if (!isCsv && !isTxt) {
      setUploadError('Unsupported file format. Please upload only .csv or .txt files.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File exceeds the 2 MB ephemeral demo safety limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawContent = typeof reader.result === 'string' ? reader.result : '';
      const content = rawContent.replace(/^\uFEFF/, '');
      if (!content.trim()) {
        setUploadError('The uploaded file is empty.');
        return;
      }
      const detectedFormat: InputFormat = isCsv ? 'csv' : 'text';
      setUploadedFileName(file.name);
      setPreviewMode(isCsv ? 'table' : 'raw');
      setCompareViewMode(isCsv ? 'csv-table' : 'text');
      onUploadFile(content, detectedFormat, file.name);
    };
    reader.onerror = () => {
      setUploadError('Unable to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleAddTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTerm.trim();
    if (trimmed.length < 2) return;
    onAddCustomTerm(trimmed);
    setNewTerm('');
  };

  const handleCopyOutput = async () => {
    if (!scanResult?.anonymizedText) return;
    try {
      await navigator.clipboard.writeText(scanResult.anonymizedText);
      setCopiedOutput(true);
      window.setTimeout(() => setCopiedOutput(false), 1800);
    } catch {
      // Clipboard fallback ignored safely
    }
  };

  const maxDiffRows = 250;
  const totalCsvDiffRows = scanResult?.csvComparison?.anonymizedRows.length ?? 0;
  const visibleCsvDiffRows =
    scanResult?.csvComparison?.anonymizedRows.slice(0, maxDiffRows) ?? [];

  return (
    <section
      id="workspace"
      className="border-b border-slate-200 bg-white py-16 lg:py-22"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Interactive Anonymization Studio
            </p>
            <h2
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Data Anonymization & PII Protection Workspace
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Upload a CSV or TXT file, paste records manually, or test with
              fictional sample datasets. Configure hybrid NLP/NER and regex
              detectors, select an anonymization mode, and inspect protected
              outputs side by side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-700">{activeSourceLabel}</span>
            <span aria-hidden="true">·</span>
            <span>In-Memory Only</span>
            <span aria-hidden="true">·</span>
            <span>NLP/NER + Regex</span>
          </div>
        </div>

        {/* Security & Demo Disclosure Banner */}
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950 sm:text-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <span className="font-semibold text-amber-950">
                Public Demo Privacy & Limitations Notice:
              </span>{' '}
              Do not upload real patient, banking, government, or confidential
              personal information to this public demonstration. All inputs are
              processed transiently in memory and never stored or logged.
              Automated NLP/NER and pattern matching significantly reduce PII
              exposure, but cannot guarantee complete anonymity against
              non-standard names, typos, or indirect quasi-identifiers.
            </div>
          </div>
        </div>

        {/* Main Workspace Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (7 cols): Input, File Upload & Preview */}
          <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:col-span-7">
            {/* Quick Fictional Sample Datasets */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Load Fictional Test Dataset
                </span>
                <span className="text-xs text-slate-500">
                  100% synthetic records for evaluation
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setUploadedFileName(null);
                      setUploadError(null);
                      onLoadSample(sample.id);
                    }}
                    className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors duration-150 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-emerald-700">
                      {sample.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-slate-500">
                      {sample.domain}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Dropzone + Format Controls */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) handleFileValidationAndRead(droppedFile);
                }}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 sm:col-span-8"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Upload className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-slate-800">
                      {uploadedFileName
                        ? `Loaded: ${uploadedFileName}`
                        : 'Upload .CSV or .TXT file (max 2 MB)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Drag and drop or browse from device
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleFileValidationAndRead(selected);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Browse File
                </button>
              </div>

              {/* Input Format Segmented Toggle */}
              <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-2 sm:col-span-4">
                <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                  Data Mode
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onFormatChange('text');
                      setPreviewMode('raw');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      format === 'text'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>TXT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFormatChange('csv');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      format === 'csv'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {uploadError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Input Editor / Preview Header */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="raw-data-input"
                  className="text-xs font-semibold text-slate-800"
                >
                  Source Data Input & Preview
                </label>

                <div className="flex items-center gap-2">
                  {format === 'csv' && parsedInputPreview && (
                    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('raw')}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                          previewMode === 'raw'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Raw Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('table')}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                          previewMode === 'table'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Table Preview
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFileName(null);
                      setUploadError(null);
                      onClearWorkspace();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {previewMode === 'table' && parsedInputPreview ? (
                <div className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-emerald-50 text-emerald-950">
                      <tr>
                        {parsedInputPreview.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="border-b border-emerald-200 px-3 py-2 font-mono font-semibold whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parsedInputPreview.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {parsedInputPreview.headers.map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap"
                            >
                              {row[cIdx] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500 tabular-nums">
                    Showing {parsedInputPreview.rows.length} of{' '}
                    {parsedInputPreview.totalRows} CSV rows
                  </div>
                </div>
              ) : (
                <textarea
                  id="raw-data-input"
                  value={inputText}
                  onChange={(e) => {
                    setUploadedFileName(null);
                    onInputTextChange(e.target.value);
                  }}
                  rows={12}
                  placeholder="Paste unstructured text, logs, or CSV rows here, upload a .csv/.txt file, or load a sample dataset above..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              )}

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                <span>
                  {inputText.length.toLocaleString()} characters ·{' '}
                  {inputText.trim() ? inputText.trim().split(/\r?\n/).length : 0} lines
                </span>
                <span>Supports UTF-8 CSV & Plain Text</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Detection Categories, Custom Terms & Anonymization Methods */}
          <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:col-span-5">
            <div className="space-y-5">
              {/* Detection Categories */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    1. Detection Categories
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    NLP/NER vs Regex
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORY_ORDER.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = categories[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => onToggleCategory(cat)}
                        aria-pressed={active}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors duration-150 cursor-pointer ${
                          active
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-xs font-medium">
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {meta.engineMethod}
                          </div>
                        </div>
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            active
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Sensitive Terms */}
              <div>
                <label
                  htmlFor="custom-term-input"
                  className="text-xs font-semibold text-slate-800"
                >
                  Custom Sensitive Terms
                </label>
                <form onSubmit={handleAddTermSubmit} className="mt-2 flex gap-2">
                  <input
                    id="custom-term-input"
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g., Project Falcon, Ward 4B..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
                {customTerms.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {customTerms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => onRemoveCustomTerm(term)}
                        title={`Remove "${term}"`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-mono text-emerald-900 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                      >
                        <span>{term}</span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymization Techniques */}
              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  2. Anonymization Technique
                </h3>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TECHNIQUE_OPTIONS.map((opt) => {
                    const selected = technique === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onTechniqueChange(opt.id)}
                        className={`rounded-lg border p-3 text-left transition-colors duration-150 cursor-pointer ${
                          selected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{opt.title}</div>
                        <div className="mt-1 truncate font-mono text-[10px] text-emerald-700">
                          {opt.example}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Replacement Label Editor */}
                {technique === 'custom' && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-semibold text-emerald-800">
                      Define Custom Replacement Labels
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {CATEGORY_ORDER.map((cat) => (
                        <div key={cat}>
                          <label className="block text-[10px] text-slate-500">
                            {CATEGORY_META[cat].shortLabel}
                          </label>
                          <input
                            type="text"
                            value={customLabels[cat]}
                            onChange={(e) =>
                              onCustomLabelChange(cat, e.target.value)
                            }
                            className="mt-0.5 w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Scan Action */}
            <button
              type="button"
              onClick={onRunScan}
              disabled={isScanning || !inputText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <ScanSearch className="h-4 w-4" />
              <span>
                {isScanning ? 'Scanning & Anonymizing...' : 'Scan & Anonymize Data'}
              </span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison & Export Bar */}
        {scanResult ? (
          <div
            id="workspace-results"
            className="mt-8 rounded-xl border border-emerald-200 bg-slate-50/70 p-5 sm:p-6"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-950">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Side-by-Side Comparison & Protected Output</span>
                  <span className="text-xs font-medium text-emerald-700">
                    ({activeSourceLabel})
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 tabular-nums">
                  {scanResult.metrics.totalEntitiesDetected} sensitive items
                  detected ({scanResult.metrics.nlpEntitiesCount} via NLP/NER,{' '}
                  {scanResult.metrics.regexEntitiesCount} via Regex,{' '}
                  {scanResult.metrics.customEntitiesCount} via Custom Rules) ·
                  Processed in {scanResult.processingTimeMs} ms
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {scanResult.csvComparison && (
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setCompareViewMode('csv-table')}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                        compareViewMode === 'csv-table'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      CSV Table Diff
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareViewMode('text')}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                        compareViewMode === 'text'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Raw Text View
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-800 cursor-pointer"
                >
                  {copiedOutput ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Protected</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onDownloadCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadTxt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/40 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800 hover:bg-teal-100 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download TXT</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadReport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Privacy Report</span>
                </button>
              </div>
            </div>

            {/* Category Color Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Highlight Key:</span>
              {CATEGORY_ORDER.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-sm ${HIGHLIGHT_STYLE[cat]}`}
                  />
                  <span>{CATEGORY_META[cat].shortLabel}</span>
                </span>
              ))}
            </div>

            {/* Comparison Views */}
            {compareViewMode === 'csv-table' && scanResult.csvComparison ? (
              <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-emerald-50 text-emerald-950">
                    <tr>
                      <th className="border-b border-emerald-200 px-3 py-2.5 font-mono">
                        Row
                      </th>
                      {scanResult.csvComparison.headers.map((h, i) => (
                        <th
                          key={i}
                          className="border-b border-emerald-200 px-3 py-2.5 font-mono whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleCsvDiffRows.map((anonRow, rIdx) => {
                      const origRow =
                        scanResult.csvComparison?.originalRows[rIdx] ?? [];
                      return (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono text-slate-400 tabular-nums">
                            {rIdx + 1}
                          </td>
                          {anonRow.map((anonCell, cIdx) => {
                            const origCell = origRow[cIdx] ?? '';
                            const changed = anonCell !== origCell;
                            return (
                              <td
                                key={cIdx}
                                className="px-3 py-2.5 font-mono whitespace-nowrap"
                              >
                                {changed ? (
                                  <div className="space-y-0.5">
                                    <div className="text-[11px] text-rose-700 line-through">
                                      {origCell}
                                    </div>
                                    <div className="font-semibold text-emerald-700">
                                      {anonCell}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-700">{anonCell}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalCsvDiffRows > maxDiffRows && (
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 tabular-nums">
                    Previewing first {maxDiffRows} of {totalCsvDiffRows} rows. All{' '}
                    {totalCsvDiffRows} rows are anonymized and included when you
                    click Download CSV.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Original Highlighted Pane */}
                <div className="flex flex-col rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="text-xs font-semibold text-rose-700">
                      Original Data (Highlighted PII)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click any highlighted term to inspect
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto p-4">
                    <HighlightedOriginalText
                      text={scanResult.originalText}
                      entities={scanResult.entities}
                      onSelectEntity={setSelectedEntity}
                      selectedEntityId={selectedEntity?.id ?? null}
                    />
                  </div>
                </div>

                {/* Protected Anonymized Pane */}
                <div className="flex flex-col rounded-lg border border-emerald-300 bg-white">
                  <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                    <span className="text-xs font-semibold text-emerald-800">
                      Protected Anonymized Output
                    </span>
                    <span className="text-[11px] text-emerald-700 capitalize">
                      Mode: {scanResult.technique}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto p-4">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-emerald-950">
                      {scanResult.anonymizedText}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Entity Inspector */}
            {selectedEntity && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <Info className="h-4 w-4 text-emerald-700" />
                  <span className="font-semibold text-slate-950">
                    {CATEGORY_META[selectedEntity.category].label}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-medium text-emerald-800">
                    Engine: {selectedEntity.engineMethod}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-700">{selectedEntity.reason}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    Output: {selectedEntity.anonymized}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            id="workspace-results"
            className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-xs text-slate-500"
          >
            Upload a .csv or .txt file, paste your data, or select a sample
            dataset above and click &ldquo;Scan &amp; Anonymize Data&rdquo; to
            view side-by-side comparison results.
          </div>
        )}
      </div>
    </section>
  );
}
