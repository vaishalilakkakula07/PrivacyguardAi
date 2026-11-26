import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Eye, EyeOff, Info, Search, ShieldCheck } from 'lucide-react';
import { CATEGORY_META, TECHNIQUE_LABELS } from '../engine/anonymizer.ts';
import type {
  BatchScanSummary,
  DetectedEntity,
  DetectionCategory,
  DetectionEngineMethod,
  ScanResult,
} from '../engine/types.ts';

interface AnalyticsDashboardProps {
  scanResult: ScanResult | null;
  batchSummary?: BatchScanSummary | null;
  onJumpToWorkspace: () => void;
}

interface AuditEntityRow extends DetectedEntity {
  sourceFile?: string;
}

const CHART_COLORS: Record<DetectionCategory, string> = {
  name: '#059669',
  email: '#0D9488',
  mobile: '#10B981',
  password: '#C026D3',
  aadhaar: '#D97706',
  pan: '#E11D48',
  ip: '#0284C7',
  custom: '#15803D',
};

export default function AnalyticsDashboard({
  scanResult,
  batchSummary,
  onJumpToWorkspace,
}: AnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [engineFilter, setEngineFilter] = useState<'all' | DetectionEngineMethod>('all');
  const [revealOriginalInTable, setRevealOriginalInTable] = useState(false);

  const isBatchMode = Boolean(batchSummary && batchSummary.files.length > 0);

  const countByCategory = useMemo(() => {
    const map: Record<DetectionCategory, number> = {
      name: 0,
      email: 0,
      mobile: 0,
      password: 0,
      aadhaar: 0,
      pan: 0,
      ip: 0,
      custom: 0,
    };
    const breakdown = isBatchMode
      ? batchSummary?.categoryBreakdown ?? []
      : scanResult?.metrics.categoryBreakdown ?? [];
    for (const item of breakdown) {
      map[item.category] = item.detectedCount;
    }
    return map;
  }, [isBatchMode, batchSummary, scanResult]);

  const allAuditEntities = useMemo<AuditEntityRow[]>(() => {
    if (isBatchMode && batchSummary) {
      return batchSummary.files.flatMap((file) =>
        file.result.entities.map((ent) => ({
          ...ent,
          id: `${file.id}_${ent.id}`,
          sourceFile: file.relativePath,
        }))
      );
    }
    return scanResult?.entities ?? [];
  }, [isBatchMode, batchSummary, scanResult]);

  const filteredEntities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allAuditEntities.filter((ent) => {
      if (engineFilter !== 'all' && ent.engineMethod !== engineFilter) return false;
      if (!q) return true;
      return (
        CATEGORY_META[ent.category].label.toLowerCase().includes(q) ||
        ent.anonymized.toLowerCase().includes(q) ||
        ent.reason.toLowerCase().includes(q) ||
        (ent.columnName ?? '').toLowerCase().includes(q) ||
        (ent.sourceFile ?? '').toLowerCase().includes(q)
      );
    });
  }, [allAuditEntities, searchTerm, engineFilter]);

  if (!scanResult && !isBatchMode) {
    return (
      <section
        id="analytics"
        className="border-b border-slate-200 bg-slate-50/75 py-16 lg:py-22"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">
              Privacy Risk Analysis & AI Detection Results
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Run a scan in the Data Anonymization Workspace above to populate
              live entity counts, category distribution charts, and educational
              privacy-risk scores.
            </p>
            <button
              type="button"
              onClick={onJumpToWorkspace}
              className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Open Workspace & Run Scan
            </button>
          </div>
        </div>
      </section>
    );
  }

  const activeBreakdown = isBatchMode
    ? batchSummary!.categoryBreakdown
    : scanResult!.metrics.categoryBreakdown;

  const totalEntitiesDetected = isBatchMode
    ? batchSummary!.totalEntitiesDetected
    : scanResult!.metrics.totalEntitiesDetected;

  const nlpCount = isBatchMode
    ? batchSummary!.nlpEntitiesCount
    : scanResult!.metrics.nlpEntitiesCount;
  const regexCount = isBatchMode
    ? batchSummary!.regexEntitiesCount
    : scanResult!.metrics.regexEntitiesCount;
  const customCount = isBatchMode
    ? batchSummary!.customEntitiesCount
    : scanResult!.metrics.customEntitiesCount;

  const beforeScore = isBatchMode
    ? batchSummary!.avgBeforeRiskScore
    : scanResult!.metrics.beforeRiskScore;
  const afterScore = isBatchMode
    ? batchSummary!.avgAfterRiskScore
    : scanResult!.metrics.afterRiskScore;
  const reductionPct = isBatchMode
    ? batchSummary!.overallRiskReductionPercent
    : scanResult!.metrics.riskReductionPercent;

  const riskLevelBefore =
    beforeScore >= 75
      ? 'Critical'
      : beforeScore >= 50
      ? 'High'
      : beforeScore >= 20
      ? 'Moderate'
      : 'Low';
  const riskLevelAfter =
    afterScore >= 55
      ? 'High'
      : afterScore >= 25
      ? 'Moderate'
      : afterScore >= 8
      ? 'Low'
      : 'Minimal';

  const personalIdentifiersCount =
    countByCategory.password +
    countByCategory.aadhaar +
    countByCategory.pan +
    countByCategory.ip;

  const distributionData = activeBreakdown.map((c) => ({
    name: CATEGORY_META[c.category].shortLabel,
    category: c.category,
    detected: c.detectedCount,
    engine: c.engineMethod,
  }));

  const exposureComparisonData = activeBreakdown.map((c) => ({
    name: CATEGORY_META[c.category].shortLabel,
    Before: c.beforeExposure,
    After: c.afterExposure,
  }));

  const engineData = [
    { name: 'NLP / NER', count: nlpCount, fill: '#059669' },
    { name: 'Regex Patterns', count: regexCount, fill: '#0D9488' },
    { name: 'Custom Rules', count: customCount, fill: '#16A34A' },
  ];

  return (
    <section
      id="analytics"
      className="border-b border-slate-200 bg-slate-50/75 py-16 lg:py-22"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              {isBatchMode
                ? `Batch Risk Assessment · ${batchSummary!.totalFiles} Files`
                : 'Live Telemetry · Educational Privacy Risk Assessment'}
            </p>
            <h2
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              AI Detection Results & Privacy Risk Analysis
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {isBatchMode
                ? `Aggregated metrics and audit entries across all ${batchSummary!.totalFiles} files in the active batch.`
                : 'All metrics and visualizations below are computed directly from your current workspace scan results.'}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600">
            <Info className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Educational risk estimates only — not a certified compliance
              guarantee.
            </span>
          </div>
        </div>

        {/* 6 Detection Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
            <div className="text-xs text-emerald-900">Total Sensitive</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {totalEntitiesDetected}
            </div>
            <div className="mt-1 text-[11px] font-medium text-emerald-700">
              {isBatchMode ? `${batchSummary!.totalFiles} Files` : 'All Categories'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Personal Names</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {countByCategory.name}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">NLP / NER</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Email Addresses</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-teal-700 tabular-nums">
              {countByCategory.email}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Regex</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Mobile Numbers</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {countByCategory.mobile}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Regex</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">IDs & Passwords</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-amber-700 tabular-nums">
              {personalIdentifiersCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {countByCategory.password} Pwd · {countByCategory.aadhaar} Aadhaar ·{' '}
              {countByCategory.pan} PAN · {countByCategory.ip} IP
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Custom Terms</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-green-700 tabular-nums">
              {countByCategory.custom}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">User Rules</div>
          </div>
        </div>

        {/* Educational Privacy Risk Score Strip */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                {isBatchMode
                  ? 'Avg Before Anonymization Risk'
                  : 'Before Anonymization (Estimated Risk)'}
              </span>
              <span className="font-semibold text-rose-700">
                {riskLevelBefore}
                {isBatchMode ? ` · Peak ${batchSummary!.maxBeforeRiskScore}` : ''}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-slate-950 tabular-nums">
                {beforeScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-rose-600 transition-all duration-300"
                style={{ width: `${beforeScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-300 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                {isBatchMode
                  ? 'Avg After Anonymization Risk'
                  : 'After Anonymization (Residual Risk)'}
              </span>
              <span className="font-semibold text-emerald-700">
                {riskLevelAfter}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                {afterScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${afterScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Estimated Privacy Improvement</span>
              <span className="font-semibold text-emerald-800">
                {scanResult?.isMixedMode
                  ? 'MIXED RULES'
                  : (scanResult?.technique ?? 'partial').toUpperCase()}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                {reductionPct}%
              </span>
              <span className="text-xs text-slate-600">exposure reduction</span>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
              Educational estimate only. Automated NLP/NER and regex pipelines reduce direct identifier exposure but cannot guarantee zero re-identification risk.
            </p>
          </div>
        </div>

        {/* Interactive Charts Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sensitive Information Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
            <h3 className="font-display text-base font-semibold text-slate-950">
              Sensitive Information Distribution
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Detected entity counts across the 8 privacy categories
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                    }}
                  />
                  <Bar dataKey="detected" name="Detected Count" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CHART_COLORS[entry.category]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Before vs After Exposure Visualization */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4">
            <h3 className="font-display text-base font-semibold text-slate-950">
              Before vs After Anonymization
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Direct identifier exposure before and after masking
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={exposureComparisonData}
                  margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="Before"
                    name="Before Masking"
                    fill="#E11D48"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="After"
                    name="Residual After"
                    fill="#059669"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detection Engine Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
            <h3 className="font-display text-base font-semibold text-slate-950">
              Detection Engine Split
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              AI/NLP vs Deterministic Regex
            </p>
            <div className="mt-4 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={engineData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={92}
                    tick={{ fill: '#334155', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                    }}
                  />
                  <Bar dataKey="count" name="Matches" radius={[0, 4, 4, 0]}>
                    {engineData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-600">
              Personal names use <strong className="text-emerald-700">Compromise NLP/NER</strong>{' '}
              while structured IDs use <strong className="text-teal-700">Regex</strong>.
            </div>
          </div>
        </div>

        {/* Category-Wise Detection Table */}
        <div
          id="audit-log"
          className="mt-6 scroll-mt-20 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-950">
                Detected Entities Audit Log
              </h3>
              <p className="text-xs text-slate-500 tabular-nums">
                {filteredEntities.length} of {allAuditEntities.length} detected
                items shown (ephemeral memory view)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter file, category, or token..."
                  className="rounded-lg border border-slate-300 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(['all', 'NLP/NER', 'Regex', 'Custom Rule'] as const).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEngineFilter(mode)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                        engineFilter === mode
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'all' ? 'All Engines' : mode}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setRevealOriginalInTable((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-800 cursor-pointer"
              >
                {revealOriginalInTable ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                    <span>Hide Source Values</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Inspect Source</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 max-h-72 overflow-auto">
            {filteredEntities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No matching sensitive entities for the current filter.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    {isBatchMode && (
                      <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                        File
                      </th>
                    )}
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Category
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Detection Engine
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Masking Style
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Source Value
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Anonymized Output
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                      Location / Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEntities.slice(0, 300).map((ent) => (
                    <tr key={ent.id} className="hover:bg-slate-50">
                      {isBatchMode && (
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {ent.sourceFile}
                        </td>
                      )}
                      <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                        {CATEGORY_META[ent.category].label}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-emerald-700 whitespace-nowrap">
                        {ent.engineMethod}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                        {TECHNIQUE_LABELS[ent.techniqueApplied]}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-rose-700 whitespace-nowrap">
                        {revealOriginalInTable ? ent.original : '••••••••••'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {ent.anonymized}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {ent.columnName
                          ? `Row ${ent.rowIndex}, Col "${ent.columnName}" · ${ent.reason}`
                          : ent.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
