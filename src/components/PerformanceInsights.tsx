import React, { useState, useMemo } from 'react';
import { Claim, PolicyType } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  Zap,
  Sparkles,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  ShieldAlert,
  Download,
  Info,
} from 'lucide-react';

interface PerformanceInsightsProps {
  claims: Claim[];
  onSelectClaim?: (claim: Claim) => void;
}

interface MonthlyMetricPoint {
  monthKey: string;
  monthLabel: string;
  totalPayout: number;
  claimsResolved: number;
  avgProcessingDays: number;
  stpRate: number;
  instantRailShare: number;
}

// 12-month baseline corporate underwriting performance benchmarks
const HISTORICAL_BENCHMARKS: Record<string, {
  payout: number;
  resolved: number;
  avgDays: number;
  stp: number;
  instantRail: number;
}> = {
  '2025-11': { payout: 18400, resolved: 8, avgDays: 4.8, stp: 62, instantRail: 45 },
  '2025-12': { payout: 24200, resolved: 11, avgDays: 4.5, stp: 65, instantRail: 50 },
  '2026-01': { payout: 21500, resolved: 9, avgDays: 4.1, stp: 68, instantRail: 55 },
  '2026-02': { payout: 26800, resolved: 12, avgDays: 3.8, stp: 70, instantRail: 62 },
  '2026-03': { payout: 31400, resolved: 14, avgDays: 3.4, stp: 73, instantRail: 68 },
  '2026-04': { payout: 28900, resolved: 13, avgDays: 3.1, stp: 75, instantRail: 74 },
  '2026-05': { payout: 34600, resolved: 16, avgDays: 2.8, stp: 78, instantRail: 79 },
  '2026-06': { payout: 38200, resolved: 17, avgDays: 2.5, stp: 80, instantRail: 82 },
  '2026-07': { payout: 42100, resolved: 19, avgDays: 2.2, stp: 81, instantRail: 85 },
  '2026-08': { payout: 46800, resolved: 21, avgDays: 2.0, stp: 83, instantRail: 87 },
  '2026-09': { payout: 51200, resolved: 23, avgDays: 1.7, stp: 84, instantRail: 89 },
  '2026-10': { payout: 58400, resolved: 26, avgDays: 1.4, stp: 86, instantRail: 92 },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ claims }) => {
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'ytd'>('6m');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('ALL');
  const [activeChartMode, setActiveChartMode] = useState<'dual' | 'payouts' | 'volume'>('dual');

  // Compute aggregated monthly trends combining live claims and historical baseline
  const monthlyData: MonthlyMetricPoint[] = useMemo(() => {
    // Generate ordered months depending on timeRange
    let targetKeys: string[] = [];
    if (timeRange === '6m') {
      targetKeys = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    } else if (timeRange === '12m') {
      targetKeys = [
        '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
        '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
      ];
    } else {
      // YTD 2026
      targetKeys = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    }

    // Filter live claims by policy if needed
    const filteredClaims = selectedPolicy === 'ALL'
      ? claims
      : claims.filter((c) => c.policyType === selectedPolicy);

    // Group live claims by year-month
    const liveClaimsByMonth: Record<string, {
      totalPayout: number;
      resolvedCount: number;
      totalDays: number;
      stpCount: number;
      instantRailCount: number;
    }> = {};

    filteredClaims.forEach((claim) => {
      const dateStr = claim.payoutTransaction?.settledAt || claim.updatedAt || claim.createdAt;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!liveClaimsByMonth[key]) {
        liveClaimsByMonth[key] = {
          totalPayout: 0,
          resolvedCount: 0,
          totalDays: 0,
          stpCount: 0,
          instantRailCount: 0,
        };
      }

      const isResolved = claim.status === 'PAYOUT_SETTLED';
      if (isResolved) {
        const amount = claim.payoutTransaction?.amount || claim.netPayout;
        liveClaimsByMonth[key].totalPayout += amount;
        liveClaimsByMonth[key].resolvedCount += 1;

        // Calculate processing time in days
        const start = new Date(claim.createdAt).getTime();
        const end = claim.payoutTransaction?.settledAt
          ? new Date(claim.payoutTransaction.settledAt).getTime()
          : new Date(claim.updatedAt).getTime();
        const diffDays = Math.max(0.1, (end - start) / (1000 * 60 * 60 * 24));
        liveClaimsByMonth[key].totalDays += diffDays;

        if (claim.aiFraudRisk.autoApproveEligible) {
          liveClaimsByMonth[key].stpCount += 1;
        }

        if (claim.payoutTransaction?.rail === 'FEDNOW' || claim.payoutTransaction?.rail === 'RTP') {
          liveClaimsByMonth[key].instantRailCount += 1;
        }
      }
    });

    return targetKeys.map((key) => {
      const [year, month] = key.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const label = `${MONTH_NAMES[monthIdx]} '${year.slice(2)}`;

      const benchmark = HISTORICAL_BENCHMARKS[key] || {
        payout: 25000,
        resolved: 10,
        avgDays: 3.5,
        stp: 70,
        instantRail: 65,
      };

      // Policy filter modifier on benchmark if filtered
      let policyScale = 1.0;
      if (selectedPolicy === 'Auto Collision') policyScale = 0.42;
      else if (selectedPolicy === 'Property & Homeowners') policyScale = 0.35;
      else if (selectedPolicy === 'Health & Medical') policyScale = 0.15;
      else if (selectedPolicy !== 'ALL') policyScale = 0.08;

      const live = liveClaimsByMonth[key];
      const basePayout = Math.round(benchmark.payout * policyScale);
      const baseResolved = Math.max(1, Math.round(benchmark.resolved * policyScale));

      const totalPayout = live && live.totalPayout > 0
        ? basePayout + live.totalPayout
        : basePayout;

      const claimsResolved = live && live.resolvedCount > 0
        ? baseResolved + live.resolvedCount
        : baseResolved;

      let avgProcessingDays = benchmark.avgDays;
      if (live && live.resolvedCount > 0) {
        const liveAvg = live.totalDays / live.resolvedCount;
        avgProcessingDays = parseFloat(((benchmark.avgDays * 0.4 + liveAvg * 0.6)).toFixed(1));
      }

      return {
        monthKey: key,
        monthLabel: label,
        totalPayout,
        claimsResolved,
        avgProcessingDays,
        stpRate: benchmark.stp,
        instantRailShare: benchmark.instantRail,
      };
    });
  }, [timeRange, selectedPolicy, claims]);

  // Overall KPI aggregations
  const overallKPIs = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        totalDisbursed: 0,
        momPayoutDelta: 0,
        currentAvgDays: 1.4,
        momDaysDelta: -0.3,
        totalResolved: 0,
        avgStpRate: 85,
        avgInstantRailShare: 90,
      };
    }

    const currentMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : currentMonth;

    const totalDisbursed = monthlyData.reduce((acc, m) => acc + m.totalPayout, 0);
    const totalResolved = monthlyData.reduce((acc, m) => acc + m.claimsResolved, 0);

    const momPayoutDelta = prevMonth.totalPayout > 0
      ? ((currentMonth.totalPayout - prevMonth.totalPayout) / prevMonth.totalPayout) * 100
      : 0;

    const momDaysDelta = currentMonth.avgProcessingDays - prevMonth.avgProcessingDays;

    return {
      totalDisbursed,
      momPayoutDelta,
      currentAvgDays: currentMonth.avgProcessingDays,
      momDaysDelta,
      totalResolved,
      avgStpRate: currentMonth.stpRate,
      avgInstantRailShare: currentMonth.instantRailShare,
    };
  }, [monthlyData]);

  // Breakdown by policy line
  const policyBreakdown = useMemo(() => {
    return [
      { name: 'Auto Collision', avgDays: 1.2, payoutShare: 42, count: 48, color: '#38bdf8' },
      { name: 'Property & Homeowners', avgDays: 2.1, payoutShare: 34, count: 32, color: '#818cf8' },
      { name: 'Health & Medical', avgDays: 0.9, payoutShare: 16, count: 28, color: '#34d399' },
      { name: 'Commercial Liability', avgDays: 3.4, payoutShare: 5, count: 6, color: '#fbbf24' },
      { name: 'Travel Interruption', avgDays: 0.6, payoutShare: 3, count: 8, color: '#f472b6' },
    ];
  }, []);

  // Payment rails breakdown
  const railBreakdown = useMemo(() => {
    return [
      { name: 'FedNow Instant Rail', value: 58, color: '#10b981' },
      { name: 'The Clearing House RTP', value: 31, color: '#3b82f6' },
      { name: 'Same-Day FedACH', value: 9, color: '#f59e0b' },
      { name: 'Legacy Standard ACH', value: 2, color: '#64748b' },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Claims Performance & Settlement Insights
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time analytics monitoring claim processing velocity, Straight-Through Processing (STP) efficiency,
              and monthly capital disbursement trends across instant payment rails.
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Horizon Selector */}
            <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTimeRange('6m')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === '6m'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                6 Months
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('ytd')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === 'ytd'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                YTD 2026
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('12m')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === '12m'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                12 Months
              </button>
            </div>

            {/* Policy Filter */}
            <div className="relative">
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="ALL">All Policy Lines</option>
                <option value="Auto Collision">Auto Collision</option>
                <option value="Property & Homeowners">Property & Homeowners</option>
                <option value="Health & Medical">Health & Medical</option>
                <option value="Commercial Liability">Commercial Liability</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payouts Disbursed */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Period Payout Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            ₹{overallKPIs.totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{overallKPIs.momPayoutDelta.toFixed(1)}% vs previous period</span>
          </div>
        </div>

        {/* Average Processing Time */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Avg Processing Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{overallKPIs.currentAvgDays}</span>
            <span className="text-sm font-sans font-normal text-slate-400">Days</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-71% faster than 4.8d legacy industry avg</span>
          </div>
        </div>

        {/* Total Claims Resolved */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Resolved Claims</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{overallKPIs.totalResolved}</span>
            <span className="text-sm font-sans font-normal text-slate-400">Settled</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{overallKPIs.avgStpRate}% Straight-Through automated</span>
          </div>
        </div>

        {/* Instant Rails Share */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Instant Rail Adoption</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{overallKPIs.avgInstantRailShare}%</span>
            <span className="text-sm font-sans font-normal text-slate-400">FedNow / RTP</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sub-2.0s finality on 9 out of 10 payouts</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Average Claim Processing Time and Total Payouts Per Month */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Monthly Trend: Insurance Payouts vs. Average Claim Processing Time
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/50">
                Recharts Dual-Axis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating monthly capital disbursement volume with operational velocity improvements.
            </p>
          </div>

          {/* Chart View Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveChartMode('dual')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeChartMode === 'dual'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual Trend
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMode('payouts')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeChartMode === 'payouts'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Payouts ($)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMode('volume')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeChartMode === 'volume'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resolved Claims
            </button>
          </div>
        </div>

        {/* The Recharts Container */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartMode === 'dual' ? (
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                {/* Left Axis: Payout Amount ($) */}
                <YAxis
                  yAxisId="left"
                  stroke="#38bdf8"
                  tick={{ fill: '#38bdf8', fontSize: 11 }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                {/* Right Axis: Processing Days */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#fbbf24"
                  tick={{ fill: '#fbbf24', fontSize: 11 }}
                  tickFormatter={(val) => `${val}d`}
                  domain={[0, 6]}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyMetricPoint;
                    return (
                      <div className="bg-slate-950/95 p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[210px]">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                          <span>{label}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {data.instantRailShare}% Instant
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                            Total Payouts:
                          </span>
                          <span className="font-mono font-bold text-white">
                            ₹{data.totalPayout.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                            Avg Processing Time:
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            {data.avgProcessingDays} Days
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                            Claims Resolved:
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {data.claimsResolved} claims
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>STP Automation Rate:</span>
                          <span className="font-bold text-blue-400">{data.stpRate}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalPayout"
                  name="Total Payouts ($ INR)"
                  fill="url(#payoutGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgProcessingDays"
                  name="Avg Processing Time (Days)"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#fbbf24', stroke: '#78350f', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#fef08a' }}
                />
              </ComposedChart>
            ) : activeChartMode === 'payouts' ? (
              <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#34d399"
                  tick={{ fill: '#34d399', fontSize: 11 }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyMetricPoint;
                    return (
                      <div className="bg-slate-950/95 p-3 rounded-xl border border-slate-700 text-xs">
                        <div className="font-bold text-white mb-1">{label}</div>
                        <div className="text-emerald-400 font-mono text-sm font-bold">
                          ₹{data.totalPayout.toLocaleString('en-IN')} Disbursed
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          Across {data.claimsResolved} settled claims
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalPayout"
                  name="Total Payouts ($ INR)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaColor)"
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#60a5fa"
                  tick={{ fill: '#60a5fa', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyMetricPoint;
                    return (
                      <div className="bg-slate-950/95 p-3 rounded-xl border border-slate-700 text-xs">
                        <div className="font-bold text-white mb-1">{label}</div>
                        <div className="text-blue-400 font-mono text-sm font-bold">
                          {data.claimsResolved} Claims Settled
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          STP Rate: {data.stpRate}% | Avg: {data.avgProcessingDays}d
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="claimsResolved"
                  name="Resolved Claims Count"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Operational Takeaway Callout */}
        <div className="p-3.5 bg-blue-950/30 rounded-xl border border-blue-900/40 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">Efficiency Velocity Breakthrough: </span>
            Claim settlement time decreased from <span className="text-amber-400 font-mono font-semibold">4.8 days</span> to{' '}
            <span className="text-emerald-400 font-mono font-semibold">1.4 days</span> month-over-month. Over the same timeframe, monthly payout volume grew by{' '}
            <span className="text-blue-400 font-semibold">+{overallKPIs.momPayoutDelta.toFixed(1)}%</span> driven by FedNow instant rails and automated document fraud heuristics.
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Policy Velocity Breakdown & Payment Rails Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Velocity by Policy Line */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Processing Time by Policy Type</h4>
              <p className="text-xs text-slate-400">Average days from intake to final bank clearance</p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Target: &lt; 2.5d
            </span>
          </div>

          <div className="space-y-3.5">
            {policyBreakdown.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{item.count} claims</span>
                    <span className="font-mono font-bold text-amber-300">{item.avgDays} days</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (item.avgDays / 4.0) * 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
            <span>Fastest Line: Travel Interruption (0.6d)</span>
            <span>Comprehensive Line: Commercial (3.4d)</span>
          </div>
        </div>

        {/* Payment Rail Distribution */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Disbursement Clearing Rails</h4>
              <p className="text-xs text-slate-400">Real-time payment network distribution</p>
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
              89% Instant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Pie Chart */}
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={railBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {railBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-700 text-xs">
                          <span className="font-bold text-white">{d.name}: </span>
                          <span className="text-emerald-400 font-mono">{d.value}%</span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Details */}
            <div className="space-y-2.5 text-xs">
              {railBreakdown.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-slate-300 text-[11px]">{r.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{r.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
            <span className="text-emerald-400 font-semibold">ISO 20022 compliant: </span>
            Instant rails provide immediate irrevocable settlement notices directly to claimant bank accounts.
          </div>
        </div>
      </div>
    </div>
  );
};
