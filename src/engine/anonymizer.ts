import nlp from 'compromise';
import Papa from 'papaparse';
import type {
  AnonymizationTechnique,
  BatchFileInput,
  BatchFileResult,
  BatchScanSummary,
  CategorySummary,
  CategoryTechniqueMap,
  CsvTableComparison,
  CustomLabelMap,
  DetectedEntity,
  DetectionCategory,
  DetectionEngineMethod,
  PartialMaskSymbol,
  PartialSymbolMap,
  RiskAnalysisMetrics,
  ScanOptions,
  ScanResult,
} from './types.ts';

export const CATEGORY_META: Record<
  DetectionCategory,
  {
    label: string;
    shortLabel: string;
    engineMethod: DetectionEngineMethod;
    severityWeight: number;
    tokenPrefix: string;
  }
> = {
  name: {
    label: 'Personal Names',
    shortLabel: 'Names',
    engineMethod: 'NLP/NER',
    severityWeight: 7,
    tokenPrefix: 'NAME',
  },
  email: {
    label: 'Email Addresses',
    shortLabel: 'Emails',
    engineMethod: 'Regex',
    severityWeight: 8,
    tokenPrefix: 'EMAIL',
  },
  mobile: {
    label: 'Mobile Numbers',
    shortLabel: 'Mobile',
    engineMethod: 'Regex',
    severityWeight: 9,
    tokenPrefix: 'PHONE',
  },
  password: {
    label: 'Passwords & Secrets',
    shortLabel: 'Password',
    engineMethod: 'Regex',
    severityWeight: 16,
    tokenPrefix: 'PASS',
  },
  aadhaar: {
    label: 'Aadhaar Numbers',
    shortLabel: 'Aadhaar',
    engineMethod: 'Regex',
    severityWeight: 15,
    tokenPrefix: 'AADHAAR',
  },
  pan: {
    label: 'PAN Numbers',
    shortLabel: 'PAN',
    engineMethod: 'Regex',
    severityWeight: 14,
    tokenPrefix: 'PAN',
  },
  ip: {
    label: 'IP Addresses',
    shortLabel: 'IP Addr',
    engineMethod: 'Regex',
    severityWeight: 6,
    tokenPrefix: 'IP',
  },
  custom: {
    label: 'Custom Sensitive Terms',
    shortLabel: 'Custom',
    engineMethod: 'Custom Rule',
    severityWeight: 10,
    tokenPrefix: 'CUSTOM',
  },
};

export const DEFAULT_CUSTOM_LABELS: CustomLabelMap = {
  name: '[CONFIDENTIAL_NAME]',
  email: '[PROTECTED_EMAIL]',
  mobile: '[MASKED_PHONE]',
  password: '[CREDENTIAL_HIDDEN]',
  aadhaar: '[ID_GOV_AADHAAR]',
  pan: '[ID_TAX_PAN]',
  ip: '[NETWORK_ADDR]',
  custom: '[RESTRICTED_TERM]',
};

export function createDefaultCategoryTechniques(): CategoryTechniqueMap {
  return {
    name: 'replacement',
    email: 'partial',
    mobile: 'partial',
    password: 'complete',
    aadhaar: 'partial',
    pan: 'custom',
    ip: 'replacement',
    custom: 'custom',
  };
}

export function createCategoryTechniqueMap(
  defaultTechnique: AnonymizationTechnique
): CategoryTechniqueMap {
  return {
    name: defaultTechnique,
    email: defaultTechnique,
    mobile: defaultTechnique,
    password: defaultTechnique,
    aadhaar: defaultTechnique,
    pan: defaultTechnique,
    ip: defaultTechnique,
    custom: defaultTechnique,
  };
}

export const TECHNIQUE_LABELS: Record<AnonymizationTechnique, string> = {
  complete: 'Complete Masking',
  partial: 'Partial Masking',
  replacement: 'Token Replacement',
  custom: 'Custom Label',
};

const PREVIEW_SAMPLES: Record<DetectionCategory, string> = {
  name: 'Aarav Kulkarni',
  email: 'aarav@maildemo.in',
  mobile: '+91 9848012345',
  password: 'BankVault#4920',
  aadhaar: '4512 8890 3421',
  pan: 'ABCDE1234F',
  ip: '192.168.14.22',
  custom: 'Project Falcon',
};

export const DEFAULT_PARTIAL_SYMBOLS: PartialSymbolMap = {
  name: '~',
  email: '*',
  mobile: '●',
  password: '■',
  aadhaar: 'X',
  pan: '#',
  ip: '-',
  custom: '?',
};

export const PARTIAL_SYMBOL_OPTIONS: {
  value: PartialMaskSymbol;
  label: string;
  example: string;
}[] = [
  { value: '*', label: 'Asterisk (*)', example: '****' },
  { value: '●', label: 'Bullet (●)', example: '●●●●' },
  { value: '■', label: 'Square (■)', example: '■■■■' },
  { value: 'X', label: 'X Mask (X)', example: 'XXXX' },
  { value: '#', label: 'Hash (#)', example: '####' },
  { value: '-', label: 'Dash (-)', example: '----' },
  { value: '~', label: 'Tilde (~)', example: '~~~~' },
  { value: '?', label: 'Question (?)', example: '????' },
  { value: '•', label: 'Dot (•)', example: '••••' },
  { value: '[HIDDEN]', label: 'Bracket ([HIDDEN])', example: '[HIDDEN]' },
];

export function getCategoryPreview(
  category: DetectionCategory,
  technique: AnonymizationTechnique,
  customLabels: CustomLabelMap,
  partialSymbols?: PartialSymbolMap
): string {
  const sample = PREVIEW_SAMPLES[category];
  switch (technique) {
    case 'complete':
      return '[REDACTED]';
    case 'partial':
      return applyPartialMask(
        sample,
        category,
        partialSymbols?.[category] ?? DEFAULT_PARTIAL_SYMBOLS[category]
      );
    case 'replacement':
      return `[${CATEGORY_META[category].tokenPrefix}_001]`;
    case 'custom': {
      const label = customLabels[category]?.trim();
      return label || '[CUSTOM_MASKED]';
    }
  }
}

function getEffectiveTechnique(
  category: DetectionCategory,
  options: ScanOptions
): AnonymizationTechnique {
  return options.categoryTechniques?.[category] ?? options.technique;
}

function buildResolvedCategoryTechniques(
  options: ScanOptions
): CategoryTechniqueMap {
  return {
    name: getEffectiveTechnique('name', options),
    email: getEffectiveTechnique('email', options),
    mobile: getEffectiveTechnique('mobile', options),
    password: getEffectiveTechnique('password', options),
    aadhaar: getEffectiveTechnique('aadhaar', options),
    pan: getEffectiveTechnique('pan', options),
    ip: getEffectiveTechnique('ip', options),
    custom: getEffectiveTechnique('custom', options),
  };
}

interface RawMatch {
  category: DetectionCategory;
  engineMethod: DetectionEngineMethod;
  original: string;
  start: number;
  end: number;
  reason: string;
  priority: number;
}

const NON_NAME_STOPWORDS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'monday', 'tuesday',
  'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'india', 'hyderabad',
  'telangana', 'bengaluru', 'mumbai', 'delhi', 'chennai', 'kolkata', 'pune',
  'privacyguard', 'hospital', 'clinic', 'bank', 'university',
  'department', 'student', 'patient', 'customer', 'record', 'address', 'email',
  'mobile', 'phone', 'aadhaar', 'pan', 'status', 'verified', 'pending', 'active',
  'ward', 'branch', 'account', 'balance', 'cardiology', 'orthopedics', 'neurology',
  'general', 'medicine', 'wing', 'block', 'research', 'ai', 'unit', 'portal',
  'apollo', 'hdfc', 'icici', 'sbi', 'axis', 'id', 'ip', 'ipv4', 'ipv6', 'csv',
  'txt', 'null', 'none', 'na', 'n/a', 'true', 'false', 'male', 'female',
  'redacted', 'confidential', 'code', 'rush', 'server', 'gateway', 'notes',
  'note', 'ticket', 'reference', 'project', 'falcon', 'tier', 'vault', 'kyc',
  'escalation', 'log', 'fictional', 'sample', 'session', 'access', 'agent',
  'alternate', 'contact', 'secondary', 'audit', 'terminal', 'registered',
  'identifiers', 'support', 'compliance', 'exception', 'facility', 'system',
  'password', 'passwd', 'pwd', 'passcode', 'secret', 'pin', 'credential',
  'credentials', 'temp', 'reset', 'portal', 'login',
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLikelyPersonName(candidate: string): boolean {
  const cleaned = candidate.trim();
  if (cleaned.length < 3 || cleaned.length > 60) return false;
  if (/\d|@|https?:\/\/|\.(com|in|org|net|edu)/i.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;

  for (const w of words) {
    const lower = w.replace(/[.,']/g, '').toLowerCase();
    if (!lower || NON_NAME_STOPWORDS.has(lower)) {
      return false;
    }
  }

  // Must start with uppercase letter for proper noun person names
  const capitalizedWords = words.filter((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w));
  return capitalizedWords.length >= 1;
}

function detectNamesWithNLP(text: string): RawMatch[] {
  if (!/[A-Za-z]{2,}/.test(text)) {
    return [];
  }
  const matches: RawMatch[] = [];
  const doc = nlp(text);
  const peopleList = doc.people().out('array') as string[];

  const candidateSet = new Set<string>();
  for (const person of peopleList) {
    const trimmed = person.replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
    if (isLikelyPersonName(trimmed)) {
      candidateSet.add(trimmed);
    }
  }

  // Contextual salutation & key-value NER boost for Indian & multicultural names
  // that lexicon-based NER alone may miss (e.g., "Dr. Priya Menon", "Name: Aarav Kulkarni")
  const contextualPatterns = [
    /(?:Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*|\s+[A-Z][a-z]+){1,3})/g,
    /(?:Patient|Customer|Student|Employee|Applicant|Lead|Contact|Name)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*|\s+[A-Z][a-z]+){1,3})/g,
    /(?:contact|customer|patient|student|applicant|user|named|by|from|to)\s+([A-Z][a-z]{2,18}\s+[A-Z][a-z]{2,18}(?:\s+[A-Z][a-z]{2,18})?)\b/g,
    // Capitalized 2-3 word name-like phrases with optional initial (e.g., "R. Kulkarni", "Aarav Vikram Rao")
    /\b([A-Z]\.\s+[A-Z][a-z]{2,20})\b/g,
  ];

  for (const pattern of contextualPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const captured = (m[1] ?? m[0]).trim();
      if (isLikelyPersonName(captured)) {
        candidateSet.add(captured);
      }
    }
  }

  // Also check CSV-like/structured Indian common full name pairs where two capitalized words appear between commas/tabs/newlines
  const structuredNameRegex = /(?:^|[,|\t\n]\s*)([A-Z][a-z]{2,18}(?:\s+[A-Z][a-z]{2,18}){1,2})(?=\s*(?:[,|\t\n]|$))/g;
  let sm: RegExpExecArray | null;
  while ((sm = structuredNameRegex.exec(text)) !== null) {
    const candidate = sm[1].trim();
    if (isLikelyPersonName(candidate)) {
      candidateSet.add(candidate);
    }
  }

  // Locate exact spans in text
  const sortedCandidates = Array.from(candidateSet).sort((a, b) => b.length - a.length);
  for (const name of sortedCandidates) {
    const regex = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(name)}(?![A-Za-z0-9])`, 'g');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const fromNLP = peopleList.some((p) => p.toLowerCase().includes(name.toLowerCase()));
      matches.push({
        category: 'name',
        engineMethod: 'NLP/NER',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: fromNLP
          ? 'Identified as Person entity via Compromise NLP/NER'
          : 'Identified as Person name via contextual NER heuristic',
        priority: 3,
      });
    }
  }

  return matches;
}

function detectRegexEntities(
  text: string,
  customTerms: string[],
  columnName?: string
): RawMatch[] {
  const matches: RawMatch[] = [];

  // 0. Passwords, passcodes, PINs, and secret keys (from labeled text or password-named CSV columns)
  if (
    columnName &&
    /^(?:password|passwd|pwd|portal_pwd|user_password|passcode|pin|secret|api_key)$/i.test(
      columnName.trim()
    )
  ) {
    const trimmedCell = text.trim();
    if (trimmedCell.length > 0 && !/^(?:null|none|n\/a|na|-)$/i.test(trimmedCell)) {
      const startIdx = text.indexOf(trimmedCell);
      matches.push({
        category: 'password',
        engineMethod: 'Regex',
        original: trimmedCell,
        start: startIdx,
        end: startIdx + trimmedCell.length,
        reason: `Detected credential value in CSV column "${columnName}"`,
        priority: 14,
      });
    }
  }

  const passwordRegex =
    /\b(?:temp\s+password|reset\s+passcode|password|passwd|pwd|passcode|secret(?:\s*key)?|auth\s*pin|pin)\s*(?:is|=|:)\s*([^\s,;'"`]+)/gi;
  let pm: RegExpExecArray | null;
  while ((pm = passwordRegex.exec(text)) !== null) {
    const secretVal = pm[1];
    if (secretVal && secretVal.length >= 3) {
      const valStart = pm.index + pm[0].lastIndexOf(secretVal);
      matches.push({
        category: 'password',
        engineMethod: 'Regex',
        original: secretVal,
        start: valStart,
        end: valStart + secretVal.length,
        reason: 'Matched labeled password / credential pattern',
        priority: 14,
      });
    }
  }

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  let m: RegExpExecArray | null;
  while ((m = emailRegex.exec(text)) !== null) {
    matches.push({
      category: 'email',
      engineMethod: 'Regex',
      original: m[0],
      start: m.index,
      end: m.index + m[0].length,
      reason: 'Matched RFC email local@domain pattern',
      priority: 10,
    });
  }

  // 2. PAN numbers (Indian Permanent Account Number: 5 letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
  while ((m = panRegex.exec(text)) !== null) {
    matches.push({
      category: 'pan',
      engineMethod: 'Regex',
      original: m[0],
      start: m.index,
      end: m.index + m[0].length,
      reason: 'Matched Indian PAN format [A-Z]{5}[0-9]{4}[A-Z]',
      priority: 12,
    });
  }

  // 3. Aadhaar numbers (12 digits, optional spaces or hyphens in 4-4-4 blocks, first digit 2-9)
  const aadhaarRegex = /\b[2-9][0-9]{3}(?:[\s-]?[0-9]{4}){2}\b/g;
  while ((m = aadhaarRegex.exec(text)) !== null) {
    const digitsOnly = m[0].replace(/[\s-]/g, '');
    if (digitsOnly.length === 12) {
      matches.push({
        category: 'aadhaar',
        engineMethod: 'Regex',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: 'Matched 12-digit UIDAI Aadhaar number format',
        priority: 11,
      });
    }
  }

  // 4. Mobile numbers (Indian +91 / 0 / 10-digit starting 6-9, or international +CC formats)
  const mobileRegex =
    /(?:(?:\+|00)[1-9]\d{0,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|[6-9]\d{9}|[6-9]\d{4}[\s-]\d{5})\b/g;
  while ((m = mobileRegex.exec(text)) !== null) {
    const digits = m[0].replace(/\D/g, '');
    // Avoid misclassifying 12-digit Aadhaar or IP segments or years
    if (digits.length >= 10 && digits.length <= 13 && digits.length !== 12) {
      matches.push({
        category: 'mobile',
        engineMethod: 'Regex',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: 'Matched mobile / telephone number pattern',
        priority: 9,
      });
    } else if (digits.length === 12 && m[0].trim().startsWith('+')) {
      matches.push({
        category: 'mobile',
        engineMethod: 'Regex',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: 'Matched international country-code mobile pattern',
        priority: 9,
      });
    }
  }

  // 5. IPv4 and IPv6 addresses
  const ipv4Regex =
    /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g;
  while ((m = ipv4Regex.exec(text)) !== null) {
    matches.push({
      category: 'ip',
      engineMethod: 'Regex',
      original: m[0],
      start: m.index,
      end: m.index + m[0].length,
      reason: 'Matched IPv4 network address octets',
      priority: 8,
    });
  }

  const ipv6Regex = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;
  while ((m = ipv6Regex.exec(text)) !== null) {
    matches.push({
      category: 'ip',
      engineMethod: 'Regex',
      original: m[0],
      start: m.index,
      end: m.index + m[0].length,
      reason: 'Matched IPv6 network address',
      priority: 8,
    });
  }

  // 6. Custom user-defined sensitive terms
  const validTerms = customTerms
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .sort((a, b) => b.length - a.length);

  for (const term of validTerms) {
    const customRegex = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(term)}(?![A-Za-z0-9])`, 'gi');
    while ((m = customRegex.exec(text)) !== null) {
      matches.push({
        category: 'custom',
        engineMethod: 'Custom Rule',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: `Matched custom sensitive term "${term}"`,
        priority: 15,
      });
    }
  }

  return matches;
}

function resolveOverlaps(rawMatches: RawMatch[]): RawMatch[] {
  // Sort by priority desc, then length desc, then start asc
  const sorted = [...rawMatches].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const accepted: RawMatch[] = [];
  for (const candidate of sorted) {
    const overlaps = accepted.some(
      (item) => !(candidate.end <= item.start || candidate.start >= item.end)
    );
    if (!overlaps) {
      accepted.push(candidate);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
}

function applyPartialMask(
  value: string,
  category: DetectionCategory,
  symbolOverride?: PartialMaskSymbol
): string {
  const sym = symbolOverride ?? DEFAULT_PARTIAL_SYMBOLS[category];
  const isBracket = sym === '[HIDDEN]';

  switch (category) {
    case 'email': {
      const atIdx = value.indexOf('@');
      if (atIdx <= 0) return isBracket ? '[HIDDEN]' : sym.repeat(4);
      const local = value.slice(0, atIdx);
      const domain = value.slice(atIdx);
      if (isBracket) return `[HIDDEN]${domain}`;
      const visible = local.slice(0, 1);
      const masked = sym.repeat(Math.max(4, local.length - 1));
      return `${visible}${masked}${domain}`;
    }
    case 'mobile': {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 6) return isBracket ? '[HIDDEN]' : sym.repeat(6);
      const prefix = value.startsWith('+') ? value.slice(0, 4) : value.slice(0, 2);
      const suffix = value.slice(-2);
      if (isBracket) return `${prefix}[HIDDEN]${suffix}`;
      const maskedLen = Math.max(4, value.length - prefix.length - suffix.length);
      return `${prefix}${sym.repeat(maskedLen)}${suffix}`;
    }
    case 'aadhaar': {
      const cleaned = value.trim();
      const last4 = cleaned.slice(-4);
      if (isBracket) {
        return cleaned.includes('-')
          ? `[HIDDEN]-[HIDDEN]-${last4}`
          : `[HIDDEN] [HIDDEN] ${last4}`;
      }
      const block = sym.repeat(4);
      return cleaned.includes('-')
        ? `${block}-${block}-${last4}`
        : cleaned.includes(' ')
        ? `${block} ${block} ${last4}`
        : `${sym.repeat(8)}${last4}`;
    }
    case 'pan': {
      if (value.length !== 10) return isBracket ? '[HIDDEN]' : sym.repeat(10);
      return isBracket
        ? `${value.slice(0, 2)}[HIDDEN]${value.slice(7)}`
        : `${value.slice(0, 2)}${sym.repeat(5)}${value.slice(7)}`;
    }
    case 'ip': {
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts.length === 4) {
          return isBracket
            ? `${parts[0]}.${parts[1]}.[HIDDEN].[HIDDEN]`
            : `${parts[0]}.${parts[1]}.${sym.repeat(3)}.${sym.repeat(3)}`;
        }
      }
      return isBracket
        ? `${value.slice(0, 4)}:[HIDDEN]:[HIDDEN]`
        : `${value.slice(0, 4)}:${sym.repeat(4)}:${sym.repeat(4)}`;
    }
    case 'name': {
      return value
        .split(/\s+/)
        .map((part) => {
          if (isBracket) return part.length <= 1 ? '[HIDDEN]' : `${part[0]}[HIDDEN]`;
          if (part.length <= 1) return sym;
          return `${part[0]}${sym.repeat(Math.min(5, part.length - 1))}`;
        })
        .join(' ');
    }
    case 'password': {
      return isBracket ? '[HIDDEN]' : sym.repeat(8);
    }
    case 'custom':
    default: {
      if (isBracket) return '[HIDDEN]';
      if (value.length <= 2) return sym.repeat(2);
      return `${value[0]}${sym.repeat(Math.max(3, value.length - 2))}${value[value.length - 1]}`;
    }
  }
}

interface TokenRegistry {
  counters: Record<DetectionCategory, number>;
  valueToToken: Map<string, string>;
}

function createTokenRegistry(): TokenRegistry {
  return {
    counters: {
      name: 0,
      email: 0,
      mobile: 0,
      password: 0,
      aadhaar: 0,
      pan: 0,
      ip: 0,
      custom: 0,
    },
    valueToToken: new Map<string, string>(),
  };
}

function formatAnonymizedValue(
  original: string,
  category: DetectionCategory,
  technique: AnonymizationTechnique,
  customLabels: CustomLabelMap,
  registry: TokenRegistry,
  partialSymbols?: PartialSymbolMap
): string {
  switch (technique) {
    case 'complete':
      return '[REDACTED]';
    case 'partial':
      return applyPartialMask(original, category, partialSymbols?.[category]);
    case 'replacement': {
      const key = `${category}::${original.toLowerCase()}`;
      const existing = registry.valueToToken.get(key);
      if (existing) return existing;
      registry.counters[category] += 1;
      const padded = String(registry.counters[category]).padStart(3, '0');
      const token = `[${CATEGORY_META[category].tokenPrefix}_${padded}]`;
      registry.valueToToken.set(key, token);
      return token;
    }
    case 'custom': {
      const label = customLabels[category]?.trim();
      return label || '[CUSTOM_MASKED]';
    }
  }
}

function detectAllActiveCategories(
  text: string,
  options: ScanOptions,
  columnName?: string
): RawMatch[] {
  const candidates: RawMatch[] = [];

  if (options.categories.name) {
    candidates.push(...detectNamesWithNLP(text));
  }

  const regexMatches = detectRegexEntities(
    text,
    options.categories.custom ? options.customTerms : [],
    columnName
  );
  for (const rm of regexMatches) {
    if (options.categories[rm.category]) {
      candidates.push(rm);
    }
  }

  return resolveOverlaps(candidates);
}

function anonymizeSegment(
  text: string,
  options: ScanOptions,
  registry: TokenRegistry,
  idCounter: { next: number },
  rowIndex?: number,
  columnName?: string
): { anonymized: string; entities: DetectedEntity[] } {
  const matches = detectAllActiveCategories(text, options, columnName);
  if (matches.length === 0) {
    return { anonymized: text, entities: [] };
  }

  let cursor = 0;
  let output = '';
  const entities: DetectedEntity[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const effectiveTechnique = getEffectiveTechnique(match.category, options);
    output += text.slice(cursor, match.start);
    const replacement = formatAnonymizedValue(
      match.original,
      match.category,
      effectiveTechnique,
      options.customLabels,
      registry,
      options.partialSymbols
    );
    output += replacement;
    cursor = match.end;

    const seqId = idCounter.next++;
    entities.push({
      id: `ent_${seqId}`,
      category: match.category,
      engineMethod: match.engineMethod,
      techniqueApplied: effectiveTechnique,
      original: match.original,
      anonymized: replacement,
      start: match.start,
      end: match.end,
      reason: match.reason,
      rowIndex,
      columnName,
    });
  }

  output += text.slice(cursor);
  return { anonymized: output, entities };
}

function computeRiskMetrics(
  allDetectedIfAllEnabled: RawMatch[],
  appliedEntities: DetectedEntity[],
  options: ScanOptions
): RiskAnalysisMetrics {
  const categoriesOrder: DetectionCategory[] = [
    'name',
    'email',
    'mobile',
    'password',
    'aadhaar',
    'pan',
    'ip',
    'custom',
  ];

  const categoryBreakdown: CategorySummary[] = categoriesOrder.map((cat) => {
    const meta = CATEGORY_META[cat];
    const baselineCount = allDetectedIfAllEnabled.filter((m) => m.category === cat).length;
    const maskedCount = appliedEntities.filter((e) => e.category === cat).length;
    const isEnabled = options.categories[cat];
    const effectiveTechnique = getEffectiveTechnique(cat, options);

    // Partial masking retains structural cues (e.g. email domain, last 4 digits), whereas full/token masking removes direct identifiers
    const residualFactor = effectiveTechnique === 'partial' ? 0.12 : 0.008;

    const beforeExposure = baselineCount;
    const afterExposure = isEnabled
      ? Number((maskedCount * residualFactor).toFixed(2))
      : baselineCount;

    return {
      category: cat,
      label: meta.label,
      engineMethod: meta.engineMethod,
      techniqueApplied: effectiveTechnique,
      detectedCount: isEnabled ? maskedCount : baselineCount,
      anonymizedCount: isEnabled ? maskedCount : 0,
      beforeExposure,
      afterExposure,
      severityWeight: meta.severityWeight,
    };
  });

  // Compute educational score (0-100) based on weighted count of sensitive entities
  const rawWeightBefore = categoryBreakdown.reduce(
    (sum, item) => sum + item.beforeExposure * item.severityWeight,
    0
  );
  const rawWeightAfter = categoryBreakdown.reduce(
    (sum, item) => sum + item.afterExposure * item.severityWeight,
    0
  );

  // Saturating curve: 1 - exp(-weight / 45) scaled to 100
  const beforeRiskScore =
    rawWeightBefore === 0
      ? 0
      : Math.min(99, Math.round(100 * (1 - Math.exp(-rawWeightBefore / 45))));

  const afterRiskScore =
    rawWeightAfter === 0
      ? 0
      : Math.min(99, Math.round(100 * (1 - Math.exp(-rawWeightAfter / 45))));

  const riskReductionPercent =
    beforeRiskScore === 0
      ? 0
      : Math.max(0, Math.round(((beforeRiskScore - afterRiskScore) / beforeRiskScore) * 100));

  const riskLevelBefore: RiskAnalysisMetrics['riskLevelBefore'] =
    beforeRiskScore >= 75
      ? 'Critical'
      : beforeRiskScore >= 50
      ? 'High'
      : beforeRiskScore >= 20
      ? 'Moderate'
      : 'Low';

  const riskLevelAfter: RiskAnalysisMetrics['riskLevelAfter'] =
    afterRiskScore >= 55
      ? 'High'
      : afterRiskScore >= 25
      ? 'Moderate'
      : afterRiskScore >= 8
      ? 'Low'
      : 'Minimal';

  const nlpEntitiesCount = appliedEntities.filter((e) => e.engineMethod === 'NLP/NER').length;
  const regexEntitiesCount = appliedEntities.filter((e) => e.engineMethod === 'Regex').length;
  const customEntitiesCount = appliedEntities.filter((e) => e.engineMethod === 'Custom Rule').length;

  return {
    beforeRiskScore,
    afterRiskScore,
    riskReductionPercent,
    totalEntitiesDetected: appliedEntities.length,
    totalEntitiesAnonymized: appliedEntities.length,
    nlpEntitiesCount,
    regexEntitiesCount,
    customEntitiesCount,
    categoryBreakdown,
    riskLevelBefore,
    riskLevelAfter,
    limitationsNote:
      'Educational estimate only. Automated NLP/NER and regex pipelines reduce direct identifier exposure but cannot guarantee zero re-identification risk against quasi-identifiers or unseen formats.',
  };
}

export function analyzeAndAnonymize(
  rawInput: string,
  options: ScanOptions
): ScanResult {
  const startTime = performance.now();
  const cleanInput = rawInput.replace(/^\uFEFF/, '');
  const registry = createTokenRegistry();
  const idCounter = { next: 1 };

  // Baseline scan with all categories active to measure unmasked exposure accurately even if user disables a category
  const allEnabledOptions: ScanOptions = {
    ...options,
    categories: {
      name: true,
      email: true,
      mobile: true,
      password: true,
      aadhaar: true,
      pan: true,
      ip: true,
      custom: options.customTerms.length > 0,
    },
  };

  let anonymizedText = '';
  let entities: DetectedEntity[] = [];
  let csvComparison: CsvTableComparison | null = null;
  let baselineMatches: RawMatch[] = [];

  if (options.format === 'csv') {
    const parsed = Papa.parse<string[]>(cleanInput.trim(), {
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|'],
    });

    const rows = parsed.data;
    if (rows.length >= 2) {
      const headers = rows[0];
      const originalDataRows = rows.slice(1);
      const anonymizedDataRows: string[][] = [];

      for (let r = 0; r < originalDataRows.length; r++) {
        const row = originalDataRows[r];
        const anonRow: string[] = [];
        for (let c = 0; c < headers.length; c++) {
          const cellValue = row[c] ?? '';
          const cellBaseline = detectAllActiveCategories(
            cellValue,
            allEnabledOptions,
            headers[c]
          );
          baselineMatches.push(...cellBaseline);

          const { anonymized, entities: cellEntities } = anonymizeSegment(
            cellValue,
            options,
            registry,
            idCounter,
            r + 1,
            headers[c]
          );
          anonRow.push(anonymized);
          entities.push(...cellEntities);
        }
        anonymizedDataRows.push(anonRow);
      }

      csvComparison = {
        headers,
        originalRows: originalDataRows,
        anonymizedRows: anonymizedDataRows,
      };
      anonymizedText = Papa.unparse([headers, ...anonymizedDataRows]);
    } else {
      // Single-line or malformed CSV fallback to text line scanning
      baselineMatches = detectAllActiveCategories(cleanInput, allEnabledOptions);
      const res = anonymizeSegment(cleanInput, options, registry, idCounter);
      anonymizedText = res.anonymized;
      entities = res.entities;
    }
  } else {
    baselineMatches = detectAllActiveCategories(cleanInput, allEnabledOptions);
    const res = anonymizeSegment(cleanInput, options, registry, idCounter);
    anonymizedText = res.anonymized;
    entities = res.entities;
  }

  const metrics = computeRiskMetrics(
    baselineMatches,
    entities,
    options
  );

  const resolvedTechniques = buildResolvedCategoryTechniques(options);
  const uniqueTechniques = new Set(Object.values(resolvedTechniques));
  const isMixedMode = uniqueTechniques.size > 1;
  const primaryTechnique: AnonymizationTechnique =
    uniqueTechniques.size === 1
      ? Array.from(uniqueTechniques)[0]
      : options.technique;

  const processingTimeMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    originalText: cleanInput,
    anonymizedText,
    format: options.format,
    technique: primaryTechnique,
    isMixedMode,
    categoryTechniques: resolvedTechniques,
    entities,
    csvComparison,
    metrics,
    processingTimeMs,
    processedInMemory: true,
  };
}

export function buildPrivacyAnalysisReport(result: ScanResult): string {
  const { metrics, technique, isMixedMode, format, processingTimeMs } = result;
  const modeSummary = isMixedMode
    ? 'MIXED (PER-CATEGORY STYLES)'
    : TECHNIQUE_LABELS[technique].toUpperCase();

  const lines: string[] = [
    '====================================================================',
    'PrivacyGuardAI — EDUCATIONAL PRIVACY ANALYSIS & ANONYMIZATION REPORT',
    'AI-Powered Data Anonymization and Privacy Protection System',
    '====================================================================',
    `Generated Timestamp : ${new Date().toISOString()}`,
    `Input Format        : ${format.toUpperCase()}`,
    `Masking Mode        : ${modeSummary}`,
    `Processing Mode     : Ephemeral In-Memory (0 bytes persisted)`,
    `Scan Duration       : ${processingTimeMs} ms`,
    '',
    '1. EDUCATIONAL PRIVACY RISK SCORE SUMMARY',
    '--------------------------------------------------------------------',
    `Before Anonymization Risk Score : ${metrics.beforeRiskScore}/100 (${metrics.riskLevelBefore})`,
    `After Anonymization Risk Score  : ${metrics.afterRiskScore}/100 (${metrics.riskLevelAfter})`,
    `Estimated Exposure Reduction    : ${metrics.riskReductionPercent}%`,
    `Total Entities Anonymized       : ${metrics.totalEntitiesAnonymized}`,
    `  - NLP/NER Engine Detections   : ${metrics.nlpEntitiesCount}`,
    `  - Regex Engine Detections     : ${metrics.regexEntitiesCount}`,
    `  - Custom Rule Detections      : ${metrics.customEntitiesCount}`,
    '',
    '2. CATEGORY-WISE DETECTION & MASKING STYLE BREAKDOWN',
    '--------------------------------------------------------------------',
  ];

  for (const cat of metrics.categoryBreakdown) {
    lines.push(
      `${cat.label.padEnd(23)} | ${cat.engineMethod.padEnd(11)} | Style: ${TECHNIQUE_LABELS[
        cat.techniqueApplied
      ].padEnd(17)} | Detected: ${String(cat.detectedCount).padStart(
        3
      )} | Anonymized: ${String(cat.anonymizedCount).padStart(3)}`
    );
  }

  lines.push(
    '',
    '3. IMPORTANT PRIVACY & METHODOLOGY DISCLAIMER',
    '--------------------------------------------------------------------',
    metrics.limitationsNote,
    'Never upload real confidential patient, banking, or citizen records',
    'to a public demonstration environment.',
    '===================================================================='
  );

  return lines.join('\n');
}

export function analyzeBatchFiles(
  batchFiles: BatchFileInput[],
  options: Omit<ScanOptions, 'format'>
): BatchScanSummary {
  const startTime = performance.now();
  const categoriesOrder: DetectionCategory[] = [
    'name',
    'email',
    'mobile',
    'password',
    'aadhaar',
    'pan',
    'ip',
    'custom',
  ];

  const results: BatchFileResult[] = batchFiles.map((file) => {
    const result = analyzeAndAnonymize(file.content, {
      ...options,
      format: file.format,
    });
    return {
      id: file.id,
      fileName: file.fileName,
      relativePath: file.relativePath,
      format: file.format,
      sizeBytes: file.sizeBytes,
      result,
    };
  });

  const totalFiles = results.length;
  const totalSizeBytes = results.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalEntitiesDetected = results.reduce(
    (sum, f) => sum + f.result.metrics.totalEntitiesDetected,
    0
  );
  const totalEntitiesAnonymized = results.reduce(
    (sum, f) => sum + f.result.metrics.totalEntitiesAnonymized,
    0
  );
  const nlpEntitiesCount = results.reduce(
    (sum, f) => sum + f.result.metrics.nlpEntitiesCount,
    0
  );
  const regexEntitiesCount = results.reduce(
    (sum, f) => sum + f.result.metrics.regexEntitiesCount,
    0
  );
  const customEntitiesCount = results.reduce(
    (sum, f) => sum + f.result.metrics.customEntitiesCount,
    0
  );

  const avgBeforeRiskScore =
    totalFiles === 0
      ? 0
      : Math.round(
          results.reduce((sum, f) => sum + f.result.metrics.beforeRiskScore, 0) /
            totalFiles
        );
  const avgAfterRiskScore =
    totalFiles === 0
      ? 0
      : Math.round(
          results.reduce((sum, f) => sum + f.result.metrics.afterRiskScore, 0) /
            totalFiles
        );
  const maxBeforeRiskScore =
    totalFiles === 0
      ? 0
      : Math.max(...results.map((f) => f.result.metrics.beforeRiskScore));

  const overallRiskReductionPercent =
    avgBeforeRiskScore === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            ((avgBeforeRiskScore - avgAfterRiskScore) / avgBeforeRiskScore) * 100
          )
        );

  const categoryBreakdown: CategorySummary[] = categoriesOrder.map((cat) => {
    const meta = CATEGORY_META[cat];
    const effectiveTechnique = getEffectiveTechnique(cat, {
      ...options,
      format: 'text',
    });

    let detectedCount = 0;
    let anonymizedCount = 0;
    let beforeExposure = 0;
    let afterExposure = 0;

    for (const file of results) {
      const match = file.result.metrics.categoryBreakdown.find(
        (c) => c.category === cat
      );
      if (match) {
        detectedCount += match.detectedCount;
        anonymizedCount += match.anonymizedCount;
        beforeExposure += match.beforeExposure;
        afterExposure += match.afterExposure;
      }
    }

    return {
      category: cat,
      label: meta.label,
      engineMethod: meta.engineMethod,
      techniqueApplied: effectiveTechnique,
      detectedCount,
      anonymizedCount,
      beforeExposure,
      afterExposure: Number(afterExposure.toFixed(2)),
      severityWeight: meta.severityWeight,
    };
  });

  const totalProcessingTimeMs = Math.max(
    1,
    Math.round(performance.now() - startTime)
  );

  return {
    totalFiles,
    totalSizeBytes,
    totalEntitiesDetected,
    totalEntitiesAnonymized,
    avgBeforeRiskScore,
    avgAfterRiskScore,
    maxBeforeRiskScore,
    overallRiskReductionPercent,
    nlpEntitiesCount,
    regexEntitiesCount,
    customEntitiesCount,
    totalProcessingTimeMs,
    categoryBreakdown,
    files: results,
  };
}

export function buildBatchPrivacyReport(batch: BatchScanSummary): string {
  const lines: string[] = [
    '====================================================================',
    'PrivacyGuardAI — BATCH PRIVACY RISK & ANONYMIZATION REPORT',
    'AI-Powered Data Anonymization and Privacy Protection System',
    '====================================================================',
    `Generated Timestamp   : ${new Date().toISOString()}`,
    `Files Processed       : ${batch.totalFiles}`,
    `Total Payload Size    : ${(batch.totalSizeBytes / 1024).toFixed(1)} KB`,
    `Processing Mode       : Ephemeral In-Memory (0 bytes persisted)`,
    `Total Batch Duration  : ${batch.totalProcessingTimeMs} ms`,
    '',
    '1. BATCH PRIVACY RISK SUMMARY',
    '--------------------------------------------------------------------',
    `Average Before Risk Score     : ${batch.avgBeforeRiskScore}/100 (Peak: ${batch.maxBeforeRiskScore}/100)`,
    `Average After Risk Score      : ${batch.avgAfterRiskScore}/100`,
    `Overall Exposure Reduction    : ${batch.overallRiskReductionPercent}%`,
    `Total Entities Anonymized     : ${batch.totalEntitiesAnonymized}`,
    `  - NLP/NER Engine Detections : ${batch.nlpEntitiesCount}`,
    `  - Regex Engine Detections   : ${batch.regexEntitiesCount}`,
    `  - Custom Rule Detections    : ${batch.customEntitiesCount}`,
    '',
    '2. AGGREGATED CATEGORY BREAKDOWN ACROSS ALL FILES',
    '--------------------------------------------------------------------',
  ];

  for (const cat of batch.categoryBreakdown) {
    lines.push(
      `${cat.label.padEnd(23)} | ${cat.engineMethod.padEnd(11)} | Style: ${TECHNIQUE_LABELS[
        cat.techniqueApplied
      ].padEnd(17)} | Detected: ${String(cat.detectedCount).padStart(
        4
      )} | Anonymized: ${String(cat.anonymizedCount).padStart(4)}`
    );
  }

  lines.push(
    '',
    '3. PER-FILE RISK & ANONYMIZATION SUMMARY',
    '--------------------------------------------------------------------'
  );

  for (const item of batch.files) {
    const m = item.result.metrics;
    lines.push(
      `${item.relativePath.padEnd(32)} | ${item.format.toUpperCase().padEnd(4)} | Entities: ${String(
        m.totalEntitiesDetected
      ).padStart(4)} | Before: ${String(m.beforeRiskScore).padStart(
        2
      )}/100 -> After: ${String(m.afterRiskScore).padStart(2)}/100 (-${m.riskReductionPercent}%)`
    );
  }

  lines.push(
    '',
    '4. IMPORTANT PRIVACY & METHODOLOGY DISCLAIMER',
    '--------------------------------------------------------------------',
    'Educational estimate only. Automated NLP/NER and regex pipelines reduce direct identifier exposure but cannot guarantee zero re-identification risk against quasi-identifiers or unseen formats.',
    '===================================================================='
  );

  return lines.join('\n');
}
