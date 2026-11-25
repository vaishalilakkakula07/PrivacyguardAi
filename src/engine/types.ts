export type DetectionCategory =
  | 'name'
  | 'email'
  | 'mobile'
  | 'aadhaar'
  | 'pan'
  | 'ip'
  | 'custom';

export type DetectionEngineMethod = 'NLP/NER' | 'Regex' | 'Custom Rule';

export type AnonymizationTechnique =
  | 'complete'
  | 'partial'
  | 'replacement'
  | 'custom';

export type InputFormat = 'text' | 'csv';

export interface CustomLabelMap {
  name: string;
  email: string;
  mobile: string;
  aadhaar: string;
  pan: string;
  ip: string;
  custom: string;
}

export interface ScanOptions {
  categories: Record<DetectionCategory, boolean>;
  technique: AnonymizationTechnique;
  customTerms: string[];
  customLabels: CustomLabelMap;
  format: InputFormat;
}

export interface DetectedEntity {
  id: string;
  category: DetectionCategory;
  engineMethod: DetectionEngineMethod;
  original: string;
  anonymized: string;
  start: number;
  end: number;
  reason: string;
  rowIndex?: number;
  columnName?: string;
}

export interface CategorySummary {
  category: DetectionCategory;
  label: string;
  engineMethod: DetectionEngineMethod;
  detectedCount: number;
  anonymizedCount: number;
  beforeExposure: number;
  afterExposure: number;
  severityWeight: number;
}

export interface RiskAnalysisMetrics {
  beforeRiskScore: number;
  afterRiskScore: number;
  riskReductionPercent: number;
  totalEntitiesDetected: number;
  totalEntitiesAnonymized: number;
  nlpEntitiesCount: number;
  regexEntitiesCount: number;
  customEntitiesCount: number;
  categoryBreakdown: CategorySummary[];
  riskLevelBefore: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskLevelAfter: 'Minimal' | 'Low' | 'Moderate' | 'High';
  limitationsNote: string;
}

export interface CsvTableComparison {
  headers: string[];
  originalRows: string[][];
  anonymizedRows: string[][];
}

export interface ScanResult {
  originalText: string;
  anonymizedText: string;
  format: InputFormat;
  technique: AnonymizationTechnique;
  entities: DetectedEntity[];
  csvComparison: CsvTableComparison | null;
  metrics: RiskAnalysisMetrics;
  processingTimeMs: number;
  processedInMemory: boolean;
}
