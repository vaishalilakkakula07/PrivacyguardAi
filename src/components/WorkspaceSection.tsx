import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  AlertCircle,
  Archive,
  Check,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Files,
  FolderOpen,
  Info,
  Plus,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CATEGORY_META,
  PARTIAL_SYMBOL_OPTIONS,
  TECHNIQUE_LABELS,
  getCategoryPreview,
} from '../engine/anonymizer.ts';
import type {
  AnonymizationTechnique,
  BatchFileInput,
  BatchFileResult,
  BatchScanSummary,
  CategoryTechniqueMap,
  CustomLabelMap,
  DetectedEntity,
  DetectionCategory,
  InputFormat,
  PartialMaskSymbol,
  PartialSymbolMap,
  ScanResult,
} from '../engine/types.ts';
import { SAMPLE_DATASETS } from '../data/samples.ts';

interface WorkspaceSectionProps {
  inputText: string;
  onInputTextChange: (val: string) => void;
  onUploadFile: (content: string, detectedFormat: InputFormat, fileName: string) => void;
  onUploadBatchFiles: (files: BatchFileInput[], sourceDesc: string) => void;
  onClearWorkspace: () => void;
  activeSourceLabel: string;
  format: InputFormat;
  onFormatChange: (fmt: InputFormat) => void;
  categories: Record<DetectionCategory, boolean>;
  onToggleCategory: (cat: DetectionCategory) => void;
  technique: AnonymizationTechnique;
  categoryTechniques: CategoryTechniqueMap;
  partialSymbols: PartialSymbolMap;
  onTechniqueChange: (tech: AnonymizationTechnique) => void;
  onApplySmartDefaults: () => void;
  onCategoryTechniqueChange: (cat: DetectionCategory, tech: AnonymizationTechnique) => void;
  onPartialSymbolChange: (cat: DetectionCategory, sym: PartialMaskSymbol) => void;
  customTerms: string[];
  onAddCustomTerm: (term: string) => void;
  onRemoveCustomTerm: (term: string) => void;
  customLabels: CustomLabelMap;
  onCustomLabelChange: (cat: DetectionCategory, val: string) => void;
  onRunScan: () => void;
  isScanning: boolean;
  scanResult: ScanResult | null;
  batchFiles: BatchFileInput[];
  batchSummary: BatchScanSummary | null;
  activeBatchFileId: string | null;
  onSelectBatchFile: (fileId: string) => void;
  onRemoveBatchFile: (fileId: string) => void;
  onLoadSample: (sampleId: string) => void;
  onLoadSampleBatch: () => void;
  onDownloadCsv: () => void;
  onDownloadTxt: () => void;
  onDownloadReport: () => void;
  onDownloadBatchFile: (fileRes: BatchFileResult) => void;
  onDownloadBatchSummaryCsv: () => void;
  onDownloadBatchZip: () => void;
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
  'password',
  'aadhaar',
  'pan',
  'ip',
  'custom',
];

const HIGHLIGHT_STYLE: Record<DetectionCategory, string> = {
  name: 'bg-emerald-100 text-emerald-950 border-b-2 border-emerald-600',
  email: 'bg-teal-100 text-teal-950 border-b-2 border-teal-600',
  mobile: 'bg-lime-100 text-lime-950 border-b-2 border-lime-600',
  password: 'bg-fuchsia-100 text-fuchsia-950 border-b-2 border-fuchsia-600',
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
  onUploadBatchFiles,
  onClearWorkspace,
  activeSourceLabel,
  format,
  onFormatChange,
  categories,
  onToggleCategory,
  technique,
  categoryTechniques,
  partialSymbols,
  onTechniqueChange,
  onApplySmartDefaults,
  onCategoryTechniqueChange,
  onPartialSymbolChange,
  customTerms,
  onAddCustomTerm,
  onRemoveCustomTerm,
  customLabels,
  onCustomLabelChange,
  onRunScan,
  isScanning,
  scanResult,
  batchFiles,
  batchSummary,
  activeBatchFileId,
  onSelectBatchFile,
  onRemoveBatchFile,
  onLoadSample,
  onLoadSampleBatch,
  onDownloadCsv,
  onDownloadTxt,
  onDownloadReport,
  onDownloadBatchFile,
  onDownloadBatchSummaryCsv,
  onDownloadBatchZip,
}: WorkspaceSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
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

  const processSelectedFiles = async (
    fileEntries: { file: File; relativePath: string }[],
    fromDirectory: boolean
  ) => {
    setUploadError(null);
    const validInputs: BatchFileInput[] = [];
    let skippedUnsupported = 0;
    let skippedOversize = 0;
    let skippedEmpty = 0;

    const cappedEntries = fileEntries.slice(0, 100);
    const truncatedCount = Math.max(0, fileEntries.length - 100);

    for (let i = 0; i < cappedEntries.length; i++) {
      const { file, relativePath } = cappedEntries[i];
      const lowerName = file.name.toLowerCase();
      const isCsv = lowerName.endsWith('.csv');
      const isTxt = lowerName.endsWith('.txt');

      if (!isCsv && !isTxt) {
        skippedUnsupported += 1;
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        skippedOversize += 1;
        continue;
      }

      try {
        const rawContent = await file.text();
        const content = rawContent.replace(/^\uFEFF/, '');
        if (!content.trim()) {
          skippedEmpty += 1;
          continue;
        }
        validInputs.push({
          id: `file_${Date.now()}_${i}`,
          fileName: file.name,
          relativePath: relativePath || file.name,
          format: isCsv ? 'csv' : 'text',
          content,
          sizeBytes: file.size,
        });
      } catch {
        skippedUnsupported += 1;
      }
    }

    if (validInputs.length === 0) {
      setUploadError(
        'No valid non-empty .csv or .txt files (max 2 MB each) were found in the selection.'
      );
      return;
    }

    const warnings: string[] = [];
    if (skippedUnsupported > 0) {
      warnings.push(`${skippedUnsupported} non-CSV/TXT file(s) skipped`);
    }
    if (skippedOversize > 0) {
      warnings.push(`${skippedOversize} file(s) exceeded 2 MB limit`);
    }
    if (skippedEmpty > 0) {
      warnings.push(`${skippedEmpty} empty file(s) skipped`);
    }
    if (truncatedCount > 0) {
      warnings.push(`capped at first 100 files (${truncatedCount} omitted)`);
    }
    if (warnings.length > 0) {
      setUploadError(`Batch note: ${warnings.join(' · ')}.`);
    }

    if (validInputs.length === 1 && !fromDirectory) {
      const only = validInputs[0];
      setUploadedFileName(only.fileName);
      setPreviewMode(only.format === 'csv' ? 'table' : 'raw');
      setCompareViewMode(only.format === 'csv' ? 'csv-table' : 'text');
      onUploadFile(only.content, only.format, only.fileName);
      return;
    }

    const desc = fromDirectory
      ? `Folder Batch (${validInputs.length} files)`
      : `Batch Upload (${validInputs.length} files)`;
    setUploadedFileName(desc);
    setPreviewMode(validInputs[0].format === 'csv' ? 'table' : 'raw');
    setCompareViewMode(validInputs[0].format === 'csv' ? 'csv-table' : 'text');
    onUploadBatchFiles(validInputs, desc);
  };

  const handleDropDataTransfer = async (dataTransfer: DataTransfer) => {
    const items = Array.from(dataTransfer.items ?? []);
    const collected: { file: File; relativePath: string }[] = [];
    let hasDirectory = false;

    type EntryLike = {
      isFile: boolean;
      isDirectory: boolean;
      name: string;
      fullPath?: string;
      file?: (cb: (f: File) => void) => void;
      createReader?: () => { readEntries: (cb: (entries: EntryLike[]) => void) => void };
    };

    const traverseEntry = async (entry: EntryLike, prefix: string): Promise<void> => {
      if (entry.isFile && entry.file) {
        const f = await new Promise<File>((resolve) => entry.file!(resolve));
        collected.push({
          file: f,
          relativePath: prefix ? `${prefix}/${f.name}` : f.name,
        });
      } else if (entry.isDirectory && entry.createReader) {
        hasDirectory = true;
        const reader = entry.createReader();
        const readAll = async (): Promise<EntryLike[]> => {
          const all: EntryLike[] = [];
          while (true) {
            const chunk = await new Promise<EntryLike[]>((resolve) =>
              reader.readEntries(resolve)
            );
            if (!chunk || chunk.length === 0) break;
            all.push(...chunk);
          }
          return all;
        };
        const children = await readAll();
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        for (const child of children) {
          await traverseEntry(child, nextPrefix);
        }
      }
    };

    const entries: EntryLike[] = [];
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.() as unknown as EntryLike | null | undefined;
      if (entry) {
        entries.push(entry);
      }
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        await traverseEntry(entry, '');
      }
      await processSelectedFiles(collected, hasDirectory);
      return;
    }

    const fallbackFiles = Array.from(dataTransfer.files ?? []).map((file) => ({
      file,
      relativePath: file.name,
    }));
    if (fallbackFiles.length > 0) {
      await processSelectedFiles(fallbackFiles, false);
    }
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
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2
              className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
              style={{ textWrap: 'balance' }}
            >
              Anonymization Workspace
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Upload a CSV or TXT file, paste text, or pick a synthetic dataset to detect and mask sensitive fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-700">{activeSourceLabel}</span>
            <span aria-hidden="true">·</span>
            <span>In-Memory Only</span>
          </div>
        </div>

        {/* Compact Ephemeral Privacy Notice */}
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            Ephemeral in-memory processing only (nothing saved or logged). Avoid uploading real confidential records to public demos.
          </span>
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
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName('Sample Batch (3 files)');
                    setUploadError(null);
                    onLoadSampleBatch();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
                >
                  <Files className="h-3.5 w-3.5" />
                  <span>Load Sample Batch (3 Files)</span>
                </button>
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

            {/* File / Directory Dropzone + Format Controls */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleDropDataTransfer(e.dataTransfer);
                }}
                className="flex flex-col justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 sm:col-span-8 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Upload className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-slate-800">
                      {uploadedFileName
                        ? `Loaded: ${uploadedFileName}`
                        : 'Upload .CSV / .TXT files or a folder'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Drag & drop files or folders, or browse (max 2 MB/file)
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []).map((file) => ({
                      file,
                      relativePath: file.name,
                    }));
                    if (selected.length > 0) {
                      void processSelectedFiles(selected, false);
                    }
                    e.target.value = '';
                  }}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []).map((file) => ({
                      file,
                      relativePath:
                        (file as File & { webkitRelativePath?: string })
                          .webkitRelativePath || file.name,
                    }));
                    if (selected.length > 0) {
                      void processSelectedFiles(selected, true);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap cursor-pointer"
                  >
                    <Files className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Select Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Select Folder</span>
                  </button>
                </div>
              </div>

              {/* Input Format Segmented Toggle */}
              <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-2 sm:col-span-4">
                <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                  {batchFiles.length > 0 ? 'Active File Mode' : 'Data Mode'}
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

            {batchFiles.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Batch Queue ({batchFiles.length} files loaded)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click a file to inspect source & diff
                  </span>
                </div>
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {batchFiles.map((bf) => {
                    const isActive = bf.id === activeBatchFileId;
                    return (
                      <div
                        key={bf.id}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-mono ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectBatchFile(bf.id)}
                          className="max-w-[200px] truncate text-left cursor-pointer"
                          title={bf.relativePath}
                        >
                          {bf.relativePath}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveBatchFile(bf.id)}
                          aria-label={`Remove ${bf.fileName}`}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

          {/* Right Column (5 cols): Detection Categories, Per-Category Masking & Custom Terms */}
          <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:col-span-5">
            <div className="space-y-5">
              {/* Quick Apply Preset to All Categories */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    1. Quick Masking Preset
                  </h3>
                  <button
                    type="button"
                    onClick={onApplySmartDefaults}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      new Set(Object.values(categoryTechniques)).size > 1
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Smart Per-Category Mix
                  </button>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TECHNIQUE_OPTIONS.map((opt) => {
                    const allMatch =
                      new Set(Object.values(categoryTechniques)).size === 1 &&
                      categoryTechniques.name === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onTechniqueChange(opt.id)}
                        className={`rounded-lg border p-2.5 text-left transition-colors duration-150 cursor-pointer ${
                          allMatch
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">All: {opt.title}</div>
                        <div className="mt-0.5 truncate font-mono text-[10px] text-emerald-700">
                          {opt.example}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-Category Detection & Masking Style Matrix */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    2. Per-Category Masking Rules
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Each category uses its own style
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  {CATEGORY_ORDER.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = categories[cat];
                    const catTech = categoryTechniques[cat];
                    const currentSymbol = partialSymbols[cat];
                    const previewOutput = getCategoryPreview(
                      cat,
                      catTech,
                      customLabels,
                      partialSymbols
                    );
                    return (
                      <div
                        key={cat}
                        className={`rounded-lg border px-3 py-2 transition-colors duration-150 ${
                          active
                            ? 'border-emerald-300 bg-white'
                            : 'border-slate-200 bg-slate-100/70 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleCategory(cat)}
                            aria-pressed={active}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                active
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {active && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-slate-900">
                                {meta.label}
                              </div>
                              <div className="truncate font-mono text-[10px] text-emerald-700">
                                {meta.engineMethod} · → {previewOutput}
                              </div>
                            </div>
                          </button>

                          <select
                            aria-label={`Masking style for ${meta.label}`}
                            value={catTech}
                            disabled={!active}
                            onChange={(e) =>
                              onCategoryTechniqueChange(
                                cat,
                                e.target.value as AnonymizationTechnique
                              )
                            }
                            className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-emerald-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            <option value="complete">Complete Masking</option>
                            <option value="partial">Partial Masking</option>
                            <option value="replacement">Token Replacement</option>
                            <option value="custom">Custom Label</option>
                          </select>
                        </div>

                        {active && catTech === 'partial' && (
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                            <span className="text-[10px] font-medium text-emerald-800 whitespace-nowrap">
                              Mask Symbol:
                            </span>
                            <select
                              aria-label={`Partial masking symbol for ${meta.label}`}
                              value={currentSymbol}
                              onChange={(e) =>
                                onPartialSymbolChange(
                                  cat,
                                  e.target.value as PartialMaskSymbol
                                )
                              }
                              className="w-full max-w-[180px] rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                            >
                              {PARTIAL_SYMBOL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {active && catTech === 'custom' && (
                          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                            <span className="text-[10px] font-medium text-emerald-800 whitespace-nowrap">
                              Label:
                            </span>
                            <input
                              type="text"
                              aria-label={`Custom replacement label for ${meta.label}`}
                              value={customLabels[cat]}
                              onChange={(e) =>
                                onCustomLabelChange(cat, e.target.value)
                              }
                              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
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
            </div>

            {/* Primary Scan Action */}
            <button
              type="button"
              onClick={onRunScan}
              disabled={isScanning || (!inputText.trim() && batchFiles.length === 0)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <ScanSearch className="h-4 w-4" />
              <span>
                {isScanning
                  ? 'Scanning & Anonymizing...'
                  : batchFiles.length > 0
                  ? `Scan & Anonymize Batch (${batchFiles.length} Files)`
                  : 'Scan & Anonymize Data'}
              </span>
            </button>
          </div>
        </div>

        {/* Batch Privacy Risk Summary (when multiple files or folder loaded) */}
        {batchSummary && batchSummary.files.length > 0 && (
          <div className="mt-8 rounded-xl border border-emerald-300 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Batch Privacy Risk Summary ({batchSummary.totalFiles} Files)
                </h3>
                <p className="mt-1 text-xs text-slate-600 tabular-nums">
                  {(batchSummary.totalSizeBytes / 1024).toFixed(1)} KB total ·{' '}
                  {batchSummary.totalEntitiesDetected} sensitive items detected ({batchSummary.nlpEntitiesCount} NLP/NER,{' '}
                  {batchSummary.regexEntitiesCount} Regex, {batchSummary.customEntitiesCount} Custom) ·{' '}
                  Processed in {batchSummary.totalProcessingTimeMs} ms
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onDownloadBatchZip}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Download All Protected (.zip)</span>
                </button>
                <button
                  type="button"
                  onClick={onDownloadBatchSummaryCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Batch Summary CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onDownloadReport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-800 whitespace-nowrap cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Batch Privacy Report</span>
                </button>
              </div>
            </div>

            {/* Batch Risk KPI Strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-[11px] text-slate-500">Files Processed</div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-950 tabular-nums">
                  {batchSummary.totalFiles}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-[11px] text-slate-500">Total Sensitive Entities</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                  {batchSummary.totalEntitiesDetected}
                </div>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3.5">
                <div className="text-[11px] text-rose-800">Avg Before Risk (Peak)</div>
                <div className="mt-1 font-mono text-xl font-bold text-rose-700 tabular-nums">
                  {batchSummary.avgBeforeRiskScore}/100{' '}
                  <span className="text-xs font-normal text-rose-600">
                    (peak {batchSummary.maxBeforeRiskScore})
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                <div className="text-[11px] text-emerald-800">Avg After Risk · Reduction</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                  {batchSummary.avgAfterRiskScore}/100{' '}
                  <span className="text-xs font-semibold text-emerald-800">
                    (-{batchSummary.overallRiskReductionPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Aggregated Batch Category Counts */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {batchSummary.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                >
                  <div className="truncate text-[11px] font-medium text-slate-600">
                    {CATEGORY_META[cat.category].shortLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-slate-950 tabular-nums">
                    {cat.detectedCount}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-File Risk Summary Table */}
            <div className="mt-4 max-h-60 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-emerald-50 text-emerald-950">
                  <tr>
                    <th className="border-b border-emerald-200 px-3 py-2 font-semibold">
                      File / Path
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 font-semibold">
                      Type
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 text-right font-semibold">
                      Detected
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 text-right font-semibold">
                      Before Risk
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 text-right font-semibold">
                      After Risk
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 text-right font-semibold">
                      Reduction
                    </th>
                    <th className="border-b border-emerald-200 px-3 py-2 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {batchSummary.files.map((item) => {
                    const isFocused = item.id === activeBatchFileId;
                    const m = item.result.metrics;
                    return (
                      <tr
                        key={item.id}
                        className={
                          isFocused ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2 font-mono text-slate-900 whitespace-nowrap">
                          {item.relativePath}
                        </td>
                        <td className="px-3 py-2 font-mono uppercase text-slate-600 whitespace-nowrap">
                          {item.format}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {m.totalEntitiesDetected}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-rose-700 tabular-nums">
                          {m.beforeRiskScore}/100
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                          {m.afterRiskScore}/100
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                          {m.riskReductionPercent}%
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectBatchFile(item.id)}
                              className={`rounded px-2 py-1 text-[11px] font-medium cursor-pointer ${
                                isFocused
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-500'
                              }`}
                            >
                              {isFocused ? 'Inspecting' : 'Inspect'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDownloadBatchFile(item)}
                              className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                  <span>
                    {batchSummary
                      ? 'Selected File Side-by-Side Diff'
                      : 'Side-by-Side Comparison & Protected Output'}
                  </span>
                  <span className="text-xs font-medium text-emerald-700">
                    (
                    {batchSummary
                      ? batchSummary.files.find((f) => f.id === activeBatchFileId)
                          ?.relativePath ?? activeSourceLabel
                      : activeSourceLabel}
                    )
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
                    <span className="text-[11px] text-emerald-700">
                      Mode:{' '}
                      {scanResult.isMixedMode
                        ? 'Per-Category Mix'
                        : TECHNIQUE_LABELS[scanResult.technique]}
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
                    Engine: {selectedEntity.engineMethod} ·{' '}
                    {TECHNIQUE_LABELS[selectedEntity.techniqueApplied]}
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
