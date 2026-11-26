/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import Papa from 'papaparse';
import Navbar from './components/Navbar.tsx';
import HeroSection from './components/HeroSection.tsx';
import WorkspaceSection from './components/WorkspaceSection.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import PrivacyReportModal from './components/PrivacyReportModal.tsx';
import Footer from './components/Footer.tsx';
import { SAMPLE_DATASETS } from './data/samples.ts';
import {
  DEFAULT_CUSTOM_LABELS,
  DEFAULT_PARTIAL_SYMBOLS,
  analyzeAndAnonymize,
  analyzeBatchFiles,
  buildBatchPrivacyReport,
  buildPrivacyAnalysisReport,
  createCategoryTechniqueMap,
  createDefaultCategoryTechniques,
} from './engine/anonymizer.ts';
import type {
  AnonymizationTechnique,
  BatchFileInput,
  BatchFileResult,
  BatchScanSummary,
  CategoryTechniqueMap,
  CustomLabelMap,
  DetectionCategory,
  InputFormat,
  PartialMaskSymbol,
  PartialSymbolMap,
  ScanOptions,
  ScanResult,
} from './engine/types.ts';
import { buildZipBlob } from './utils/zipBuilder.ts';

const DEFAULT_SAMPLE = SAMPLE_DATASETS[0]; // Healthcare CSV sample on initial load

function looksLikeCsv(text: string): boolean {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return false;
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  const parsed = Papa.parse<string[]>(trimmed, {
    skipEmptyLines: true,
    delimitersToGuess: [',', ';', '\t', '|'],
  });
  if (parsed.data.length < 2) return false;
  const headerLen = parsed.data[0].length;
  if (headerLen < 2) return false;
  const matchingRows = parsed.data
    .slice(1, 6)
    .filter((row) => row.length === headerLen).length;
  return matchingRows >= Math.min(parsed.data.length - 1, 2);
}

function triggerBrowserDownload(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [inputText, setInputText] = useState<string>(DEFAULT_SAMPLE.content);
  const [format, setFormat] = useState<InputFormat>(DEFAULT_SAMPLE.format);
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>(
    `Sample: ${DEFAULT_SAMPLE.title}`
  );
  const [categories, setCategories] = useState<Record<DetectionCategory, boolean>>({
    name: true,
    email: true,
    mobile: true,
    password: true,
    aadhaar: true,
    pan: true,
    ip: true,
    custom: true,
  });
  const [technique, setTechnique] = useState<AnonymizationTechnique>('partial');
  const [categoryTechniques, setCategoryTechniques] = useState<CategoryTechniqueMap>(
    () => createDefaultCategoryTechniques()
  );
  const [customTerms, setCustomTerms] = useState<string[]>(
    DEFAULT_SAMPLE.suggestedCustomTerms
  );
  const [customLabels, setCustomLabels] = useState<CustomLabelMap>(
    DEFAULT_CUSTOM_LABELS
  );
  const [partialSymbols, setPartialSymbols] = useState<PartialSymbolMap>(
    DEFAULT_PARTIAL_SYMBOLS
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [batchFiles, setBatchFiles] = useState<BatchFileInput[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchScanSummary | null>(null);
  const [activeBatchFileId, setActiveBatchFileId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(() =>
    analyzeAndAnonymize(DEFAULT_SAMPLE.content, {
      categories: {
        name: true,
        email: true,
        mobile: true,
        password: true,
        aadhaar: true,
        pan: true,
        ip: true,
        custom: true,
      },
      technique: 'partial',
      categoryTechniques: createDefaultCategoryTechniques(),
      partialSymbols: DEFAULT_PARTIAL_SYMBOLS,
      customTerms: DEFAULT_SAMPLE.suggestedCustomTerms,
      customLabels: DEFAULT_CUSTOM_LABELS,
      format: DEFAULT_SAMPLE.format,
    })
  );

  const navigateToSection = useCallback((sectionId: string) => {
    const el =
      document.getElementById(sectionId) ??
      (sectionId === 'audit-log'
        ? document.getElementById('analytics')
        : null);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const executeScan = useCallback(
    async (textToScan: string, options: ScanOptions, scrollToResults = false) => {
      if (!textToScan.trim()) return;
      setIsScanning(true);
      try {
        const response = await fetch('/api/anonymize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: textToScan, options }),
        });
        if (response.ok) {
          const data = (await response.json()) as ScanResult;
          setScanResult(data);
        } else {
          setScanResult(analyzeAndAnonymize(textToScan, options));
        }
      } catch {
        setScanResult(analyzeAndAnonymize(textToScan, options));
      } finally {
        setIsScanning(false);
        if (scrollToResults) {
          window.requestAnimationFrame(() => {
            document
              .getElementById('workspace-results')
              ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
      }
    },
    []
  );

  const executeBatchScan = useCallback(
    async (
      filesToScan: BatchFileInput[],
      options: Omit<ScanOptions, 'format'>,
      scrollToResults = false,
      preferredFileId?: string | null
    ) => {
      if (filesToScan.length === 0) return;
      setIsScanning(true);
      try {
        let summary: BatchScanSummary;
        const response = await fetch('/api/anonymize-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: filesToScan, options }),
        });
        if (response.ok) {
          summary = (await response.json()) as BatchScanSummary;
        } else {
          summary = analyzeBatchFiles(filesToScan, options);
        }
        setBatchSummary(summary);
        const selected =
          summary.files.find((f) => f.id === preferredFileId) ??
          summary.files[0] ??
          null;
        if (selected) {
          setActiveBatchFileId(selected.id);
          setFormat(selected.format);
          setInputText(selected.result.originalText);
          setScanResult(selected.result);
        }
      } catch {
        const summary = analyzeBatchFiles(filesToScan, options);
        setBatchSummary(summary);
        const selected =
          summary.files.find((f) => f.id === preferredFileId) ??
          summary.files[0] ??
          null;
        if (selected) {
          setActiveBatchFileId(selected.id);
          setFormat(selected.format);
          setInputText(selected.result.originalText);
          setScanResult(selected.result);
        }
      } finally {
        setIsScanning(false);
        if (scrollToResults) {
          window.requestAnimationFrame(() => {
            document
              .getElementById('workspace-results')
              ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
      }
    },
    []
  );

  const handleRunScan = useCallback(() => {
    if (batchFiles.length > 0) {
      void executeBatchScan(
        batchFiles,
        {
          categories,
          technique,
          categoryTechniques,
          partialSymbols,
          customTerms,
          customLabels,
        },
        true,
        activeBatchFileId
      );
      return;
    }

    if (!inputText.trim()) return;
    let effectiveFormat = format;
    if (format === 'text' && looksLikeCsv(inputText)) {
      effectiveFormat = 'csv';
      setFormat('csv');
    }
    void executeScan(
      inputText,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms,
        customLabels,
        format: effectiveFormat,
      },
      true
    );
  }, [
    batchFiles,
    activeBatchFileId,
    executeBatchScan,
    executeScan,
    inputText,
    categories,
    technique,
    categoryTechniques,
    partialSymbols,
    customTerms,
    customLabels,
    format,
  ]);

  // Re-run anonymization instantaneously when masking options change on active input or batch
  useEffect(() => {
    if (batchFiles.length > 0) {
      const totalChars = batchFiles.reduce((s, f) => s + f.content.length, 0);
      if (totalChars > 150_000) return;
      const summary = analyzeBatchFiles(batchFiles, {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms,
        customLabels,
      });
      setBatchSummary(summary);
      const selected =
        summary.files.find((f) => f.id === activeBatchFileId) ??
        summary.files[0] ??
        null;
      if (selected) {
        setScanResult(selected.result);
      }
      return;
    }

    if (!inputText.trim()) {
      setScanResult(null);
      return;
    }
    if (inputText.length > 25_000) return;
    const updated = analyzeAndAnonymize(inputText, {
      categories,
      technique,
      categoryTechniques,
      partialSymbols,
      customTerms,
      customLabels,
      format,
    });
    setScanResult(updated);
  }, [
    batchFiles,
    activeBatchFileId,
    categories,
    technique,
    categoryTechniques,
    partialSymbols,
    customTerms,
    customLabels,
    format,
    inputText,
  ]);

  const handleInputTextChange = (val: string) => {
    setBatchFiles([]);
    setBatchSummary(null);
    setActiveBatchFileId(null);
    setInputText(val);
    setActiveSourceLabel(val.trim() ? 'Manual Input' : 'No Data Loaded');
  };

  const handleUploadFile = (
    content: string,
    detectedFormat: InputFormat,
    fileName: string
  ) => {
    setBatchFiles([]);
    setBatchSummary(null);
    setActiveBatchFileId(null);
    setFormat(detectedFormat);
    setInputText(content);
    setActiveSourceLabel(`Uploaded File: ${fileName}`);
    void executeScan(
      content,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms,
        customLabels,
        format: detectedFormat,
      },
      true
    );
  };

  const handleUploadBatchFiles = (files: BatchFileInput[], sourceDesc: string) => {
    if (files.length === 0) return;
    if (files.length === 1) {
      handleUploadFile(files[0].content, files[0].format, files[0].relativePath);
      return;
    }
    setBatchFiles(files);
    setActiveBatchFileId(files[0].id);
    setFormat(files[0].format);
    setInputText(files[0].content);
    setActiveSourceLabel(sourceDesc);
    void executeBatchScan(
      files,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms,
        customLabels,
      },
      true,
      files[0].id
    );
  };

  const handleSelectBatchFile = (fileId: string) => {
    setActiveBatchFileId(fileId);
    const match = batchSummary?.files.find((f) => f.id === fileId);
    if (match) {
      setFormat(match.format);
      setInputText(match.result.originalText);
      setScanResult(match.result);
    }
  };

  const handleRemoveBatchFile = (fileId: string) => {
    const remaining = batchFiles.filter((f) => f.id !== fileId);
    if (remaining.length === 0) {
      handleClearWorkspace();
      return;
    }
    if (remaining.length === 1) {
      handleUploadFile(
        remaining[0].content,
        remaining[0].format,
        remaining[0].relativePath
      );
      return;
    }
    setBatchFiles(remaining);
    const nextActive =
      activeBatchFileId === fileId ? remaining[0].id : activeBatchFileId;
    setActiveSourceLabel(`Batch (${remaining.length} files)`);
    void executeBatchScan(
      remaining,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms,
        customLabels,
      },
      false,
      nextActive
    );
  };

  const handleLoadSampleBatch = () => {
    const combinedTerms = Array.from(
      new Set(SAMPLE_DATASETS.flatMap((s) => s.suggestedCustomTerms))
    );
    const sampleBatch: BatchFileInput[] = SAMPLE_DATASETS.map((s, idx) => ({
      id: `sample_${idx + 1}`,
      fileName: `${s.id}.${s.format === 'csv' ? 'csv' : 'txt'}`,
      relativePath: `samples/${s.id}.${s.format === 'csv' ? 'csv' : 'txt'}`,
      format: s.format,
      content: s.content,
      sizeBytes: new Blob([s.content]).size,
    }));
    setCustomTerms(combinedTerms);
    setBatchFiles(sampleBatch);
    setActiveBatchFileId(sampleBatch[0].id);
    setFormat(sampleBatch[0].format);
    setInputText(sampleBatch[0].content);
    setActiveSourceLabel(`Sample Batch (${sampleBatch.length} files)`);
    void executeBatchScan(
      sampleBatch,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms: combinedTerms,
        customLabels,
      },
      true,
      sampleBatch[0].id
    );
  };

  const handleClearWorkspace = () => {
    setBatchFiles([]);
    setBatchSummary(null);
    setActiveBatchFileId(null);
    setInputText('');
    setScanResult(null);
    setActiveSourceLabel('No Data Loaded');
  };

  const handleToggleCategory = (cat: DetectionCategory) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleTechniquePresetChange = (tech: AnonymizationTechnique) => {
    setTechnique(tech);
    setCategoryTechniques(createCategoryTechniqueMap(tech));
  };

  const handleApplySmartDefaults = () => {
    setTechnique('partial');
    setCategoryTechniques(createDefaultCategoryTechniques());
    setPartialSymbols(DEFAULT_PARTIAL_SYMBOLS);
  };

  const handleCategoryTechniqueChange = (
    cat: DetectionCategory,
    tech: AnonymizationTechnique
  ) => {
    setCategoryTechniques((prev) => ({ ...prev, [cat]: tech }));
    setCategories((prev) => ({ ...prev, [cat]: true }));
  };

  const handleAddCustomTerm = (term: string) => {
    setCustomTerms((prev) =>
      prev.some((t) => t.toLowerCase() === term.toLowerCase())
        ? prev
        : [...prev, term]
    );
  };

  const handleRemoveCustomTerm = (term: string) => {
    setCustomTerms((prev) => prev.filter((t) => t !== term));
  };

  const handleCustomLabelChange = (cat: DetectionCategory, val: string) => {
    setCustomLabels((prev) => ({ ...prev, [cat]: val }));
  };

  const handlePartialSymbolChange = (
    cat: DetectionCategory,
    sym: PartialMaskSymbol
  ) => {
    setPartialSymbols((prev) => ({ ...prev, [cat]: sym }));
  };

  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (!found) return;
    setBatchFiles([]);
    setBatchSummary(null);
    setActiveBatchFileId(null);
    setFormat(found.format);
    setInputText(found.content);
    setCustomTerms(found.suggestedCustomTerms);
    setActiveSourceLabel(`Sample: ${found.title}`);
    void executeScan(
      found.content,
      {
        categories,
        technique,
        categoryTechniques,
        partialSymbols,
        customTerms: found.suggestedCustomTerms,
        customLabels,
        format: found.format,
      },
      true
    );
  };

  const handleDownloadCsv = () => {
    if (!scanResult) return;
    let csvPayload = scanResult.anonymizedText;
    if (!scanResult.csvComparison) {
      const lines = scanResult.anonymizedText.split(/\r?\n/);
      csvPayload = Papa.unparse([['Anonymized_Text'], ...lines.map((l) => [l])]);
    }
    triggerBrowserDownload(
      csvPayload,
      `privacyguard_anonymized_${Date.now()}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleDownloadTxt = () => {
    if (!scanResult) return;
    triggerBrowserDownload(
      scanResult.anonymizedText,
      `privacyguard_anonymized_${Date.now()}.txt`,
      'text/plain;charset=utf-8;'
    );
  };

  const handleDownloadReport = () => {
    if (batchSummary) {
      const report = buildBatchPrivacyReport(batchSummary);
      triggerBrowserDownload(
        report,
        `privacyguard_batch_risk_report_${Date.now()}.txt`,
        'text/plain;charset=utf-8;'
      );
      return;
    }
    if (!scanResult) return;
    const report = buildPrivacyAnalysisReport(scanResult);
    triggerBrowserDownload(
      report,
      `privacyguard_risk_report_${Date.now()}.txt`,
      'text/plain;charset=utf-8;'
    );
  };

  const handleDownloadBatchFile = (fileRes: BatchFileResult) => {
    const mime =
      fileRes.format === 'csv'
        ? 'text/csv;charset=utf-8;'
        : 'text/plain;charset=utf-8;';
    triggerBrowserDownload(
      fileRes.result.anonymizedText,
      `anonymized_${fileRes.fileName}`,
      mime
    );
  };

  const handleDownloadBatchSummaryCsv = () => {
    if (!batchSummary) return;
    const rows = [
      [
        'File_Path',
        'Format',
        'Size_Bytes',
        'Entities_Detected',
        'Before_Risk_Score',
        'After_Risk_Score',
        'Risk_Reduction_Pct',
        'Processing_Time_Ms',
      ],
      ...batchSummary.files.map((f) => [
        f.relativePath,
        f.format.toUpperCase(),
        String(f.sizeBytes),
        String(f.result.metrics.totalEntitiesDetected),
        String(f.result.metrics.beforeRiskScore),
        String(f.result.metrics.afterRiskScore),
        String(f.result.metrics.riskReductionPercent),
        String(f.result.processingTimeMs),
      ]),
    ];
    triggerBrowserDownload(
      Papa.unparse(rows),
      `privacyguard_batch_summary_${Date.now()}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleDownloadBatchZip = () => {
    if (!batchSummary) return;
    const zipBlob = buildZipBlob([
      ...batchSummary.files.map((f) => ({
        path: `anonymized/${f.relativePath}`,
        content: f.result.anonymizedText,
      })),
      {
        path: 'privacyguard_batch_risk_report.txt',
        content: buildBatchPrivacyReport(batchSummary),
      },
    ]);
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `privacyguard_anonymized_batch_${Date.now()}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onNavigate={navigateToSection}
        onOpenReport={() => setReportModalOpen(true)}
        hasResults={Boolean(scanResult || batchSummary)}
      />

      <main>
        <HeroSection
          onGetStarted={() => navigateToSection('workspace')}
          onExploreFeatures={() => navigateToSection('analytics')}
        />

        <WorkspaceSection
          inputText={inputText}
          onInputTextChange={handleInputTextChange}
          onUploadFile={handleUploadFile}
          onUploadBatchFiles={handleUploadBatchFiles}
          onClearWorkspace={handleClearWorkspace}
          activeSourceLabel={activeSourceLabel}
          format={format}
          onFormatChange={setFormat}
          categories={categories}
          onToggleCategory={handleToggleCategory}
          technique={technique}
          categoryTechniques={categoryTechniques}
          partialSymbols={partialSymbols}
          onTechniqueChange={handleTechniquePresetChange}
          onApplySmartDefaults={handleApplySmartDefaults}
          onCategoryTechniqueChange={handleCategoryTechniqueChange}
          onPartialSymbolChange={handlePartialSymbolChange}
          customTerms={customTerms}
          onAddCustomTerm={handleAddCustomTerm}
          onRemoveCustomTerm={handleRemoveCustomTerm}
          customLabels={customLabels}
          onCustomLabelChange={handleCustomLabelChange}
          onRunScan={handleRunScan}
          isScanning={isScanning}
          scanResult={scanResult}
          batchFiles={batchFiles}
          batchSummary={batchSummary}
          activeBatchFileId={activeBatchFileId}
          onSelectBatchFile={handleSelectBatchFile}
          onRemoveBatchFile={handleRemoveBatchFile}
          onLoadSample={handleLoadSample}
          onLoadSampleBatch={handleLoadSampleBatch}
          onDownloadCsv={handleDownloadCsv}
          onDownloadTxt={handleDownloadTxt}
          onDownloadReport={() => setReportModalOpen(true)}
          onDownloadBatchFile={handleDownloadBatchFile}
          onDownloadBatchSummaryCsv={handleDownloadBatchSummaryCsv}
          onDownloadBatchZip={handleDownloadBatchZip}
        />

        <AnalyticsDashboard
          scanResult={scanResult}
          batchSummary={batchSummary}
          onJumpToWorkspace={() => navigateToSection('workspace')}
        />
      </main>

      <Footer onNavigate={navigateToSection} />

      <PrivacyReportModal
        scanResult={scanResult}
        batchSummary={batchSummary}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onDownloadReport={handleDownloadReport}
      />
    </div>
  );
}
