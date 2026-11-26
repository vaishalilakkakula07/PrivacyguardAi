export type DetectionCategory =
  | 'name'
  | 'email'
  | 'mobile'
  | 'password'
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

export type CategoryTechniqueMap = Record<DetectionCategory, AnonymizationTechnique>;

export type PartialMaskSymbol =
  | '*'
  | '●'
  | '■'
  | 'X'
  | '-'
  | '#'
  | '~'
  | '?'
  | '•'
  | '[HIDDEN]';

export type PartialSymbolMap = Record<DetectionCategory, PartialMaskSymbol>;

export interface CustomLabelMap {
  name: string;
  email: string;
  mobile: string;
  password: string;
  aadhaar: string;
  pan: string;
  ip: string;
  custom: string;
}

export interface ScanOptions {
  categories: Record<DetectionCategory, boolean>;
  technique: AnonymizationTechnique;
  categoryTechniques?: CategoryTechniqueMap;
  partialSymbols?: PartialSymbolMap;
  customTerms: string[];
  customLabels: CustomLabelMap;
  format: InputFormat;
}

export interface DetectedEntity {
  id: string;
  category: DetectionCategory;
  engineMethod: DetectionEngineMethod;
  techniqueApplied: AnonymizationTechnique;
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
  techniqueApplied: AnonymizationTechnique;
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
  isMixedMode: boolean;
  categoryTechniques: CategoryTechniqueMap;
  entities: DetectedEntity[];
  csvComparison: CsvTableComparison | null;
  metrics: RiskAnalysisMetrics;
  processingTimeMs: number;
  processedInMemory: boolean;
}

export interface BatchFileInput {
  id: string;
  fileName: string;
  relativePath: string;
  format: InputFormat;
  content: string;
  sizeBytes: number;
}

export interface BatchFileResult {
  id: string;
  fileName: string;
  relativePath: string;
  format: InputFormat;
  sizeBytes: number;
  result: ScanResult;
}

export interface BatchScanSummary {
  totalFiles: number;
  totalSizeBytes: number;
  totalEntitiesDetected: number;
  totalEntitiesAnonymized: number;
  avgBeforeRiskScore: number;
  avgAfterRiskScore: number;
  maxBeforeRiskScore: number;
  overallRiskReductionPercent: number;
  nlpEntitiesCount: number;
  regexEntitiesCount: number;
  customEntitiesCount: number;
  totalProcessingTimeMs: number;
  categoryBreakdown: CategorySummary[];
  files: BatchFileResult[];
}
