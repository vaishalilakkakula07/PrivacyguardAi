/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import Papa from 'papaparse';
import Navbar from './components/Navbar.tsx';
import HeroSection from './components/HeroSection.tsx';
import AboutSection from './components/AboutSection.tsx';
import WorkspaceSection from './components/WorkspaceSection.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import WorkflowAndApplications from './components/WorkflowAndApplications.tsx';
import TechImpactTeamRefs from './components/TechImpactTeamRefs.tsx';
import PrivacyReportModal from './components/PrivacyReportModal.tsx';
import Footer from './components/Footer.tsx';
import { SAMPLE_DATASETS } from './data/samples.ts';
import {
  DEFAULT_CUSTOM_LABELS,
  analyzeAndAnonymize,
  buildPrivacyAnalysisReport,
} from './engine/anonymizer.ts';
import type {
  AnonymizationTechnique,
  CustomLabelMap,
  DetectionCategory,
  InputFormat,
  ScanOptions,
  ScanResult,
} from './engine/types.ts';

const DEFAULT_SAMPLE = SAMPLE_DATASETS[1]; // Banking KYC TXT with rich mixed PII

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
  const [categories, setCategories] = useState<Record<DetectionCategory, boolean>>({
    name: true,
    email: true,
    mobile: true,
    aadhaar: true,
    pan: true,
    ip: true,
    custom: true,
  });
  const [technique, setTechnique] = useState<AnonymizationTechnique>('partial');
  const [customTerms, setCustomTerms] = useState<string[]>(
    DEFAULT_SAMPLE.suggestedCustomTerms
  );
  const [customLabels, setCustomLabels] = useState<CustomLabelMap>(
    DEFAULT_CUSTOM_LABELS
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(() =>
    analyzeAndAnonymize(DEFAULT_SAMPLE.content, {
      categories: {
        name: true,
        email: true,
        mobile: true,
        aadhaar: true,
        pan: true,
        ip: true,
        custom: true,
      },
      technique: 'partial',
      customTerms: DEFAULT_SAMPLE.suggestedCustomTerms,
      customLabels: DEFAULT_CUSTOM_LABELS,
      format: DEFAULT_SAMPLE.format,
    })
  );

  const navigateToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const executeScan = useCallback(
    async (
      textToScan: string,
      options: ScanOptions
    ) => {
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
          // Graceful in-browser engine fallback
          setScanResult(analyzeAndAnonymize(textToScan, options));
        }
      } catch {
        setScanResult(analyzeAndAnonymize(textToScan, options));
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  const handleRunScan = useCallback(() => {
    void executeScan(inputText, {
      categories,
      technique,
      customTerms,
      customLabels,
      format,
    });
  }, [
    executeScan,
    inputText,
    categories,
    technique,
    customTerms,
    customLabels,
    format,
  ]);

  // Re-run anonymization immediately when technique or category options change on existing result
  useEffect(() => {
    if (!inputText.trim()) return;
    const updated = analyzeAndAnonymize(inputText, {
      categories,
      technique,
      customTerms,
      customLabels,
      format,
    });
    setScanResult(updated);
    // Intentionally syncs options instantaneously when user toggles masking modes
  }, [categories, technique, customTerms, customLabels, format]);

  const handleToggleCategory = (cat: DetectionCategory) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
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

  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (!found) return;
    setInputText(found.content);
    setFormat(found.format);
    setCustomTerms(found.suggestedCustomTerms);
    void executeScan(found.content, {
      categories,
      technique,
      customTerms: found.suggestedCustomTerms,
      customLabels,
      format: found.format,
    });
  };

  const handleDownloadCsv = () => {
    if (!scanResult) return;
    let csvPayload = scanResult.anonymizedText;
    if (!scanResult.csvComparison) {
      // Convert text lines into clean single-column CSV if source was TXT
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
    if (!scanResult) return;
    const report = buildPrivacyAnalysisReport(scanResult);
    triggerBrowserDownload(
      report,
      `privacyguard_risk_report_${Date.now()}.txt`,
      'text/plain;charset=utf-8;'
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar onNavigate={navigateToSection} />

      <main>
        <HeroSection
          onGetStarted={() => navigateToSection('workspace')}
          onExploreFeatures={() => navigateToSection('about')}
        />

        <AboutSection />

        <WorkspaceSection
          inputText={inputText}
          onInputTextChange={setInputText}
          format={format}
          onFormatChange={setFormat}
          categories={categories}
          onToggleCategory={handleToggleCategory}
          technique={technique}
          onTechniqueChange={setTechnique}
          customTerms={customTerms}
          onAddCustomTerm={handleAddCustomTerm}
          onRemoveCustomTerm={handleRemoveCustomTerm}
          customLabels={customLabels}
          onCustomLabelChange={handleCustomLabelChange}
          onRunScan={handleRunScan}
          isScanning={isScanning}
          scanResult={scanResult}
          onLoadSample={handleLoadSample}
          onDownloadCsv={handleDownloadCsv}
          onDownloadTxt={handleDownloadTxt}
          onDownloadReport={() => setReportModalOpen(true)}
        />

        <AnalyticsDashboard
          scanResult={scanResult}
          onJumpToWorkspace={() => navigateToSection('workspace')}
        />

        <WorkflowAndApplications />

        <TechImpactTeamRefs />
      </main>

      <Footer onNavigate={navigateToSection} />

      <PrivacyReportModal
        scanResult={scanResult}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onDownloadReport={handleDownloadReport}
      />
    </div>
  );
}
