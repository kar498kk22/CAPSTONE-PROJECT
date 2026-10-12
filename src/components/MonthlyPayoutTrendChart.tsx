import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Zap,
  Layers,
  BarChart3,
  Calendar,
  Download,
  Table,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Claim, PolicyType } from '../types';

export interface MonthlyTrendDataPoint {
  monthKey: string; // e.g. "2026-05"
  monthLabel: string; // e.g. "May 2026"
  shortMonth: string; // e.g. "May"
  payoutDisbursed: number; // in INR
  claimsResolved: number; // total count
  autoApprovedCount: number; // STP straight-through count
  adjusterApprovedCount: number; // manual adjuster review
  avgResolutionSeconds: number; // avg settlement latency
  payoutByPolicy: {
    auto: number;
    property: number;
    health: number;
    commercial: number;
  };
  rtpRailVolume: number;
  fedNowRailVolume: number;
}

interface MonthlyPayoutTrendChartProps {
  claims: Claim[];
  selectedPolicyFilter?: string;
}

// 12-month baseline financial operations data for ClaimFlow
const HISTORICAL_MONTHLY_BASELINES: Omit<MonthlyTrendDataPoint, 'monthLabel' | 'shortMonth'>[] = [
  {
    monthKey: '2025-11',
    payoutDisbursed: 132400,
    claimsResolved: 42,
    autoApprovedCount: 32,
    adjusterApprovedCount: 10,
    avgResolutionSeconds: 3.4,
    payoutByPolicy: { auto: 64200, property: 45000, health: 18200, commercial: 5000 },
    rtpRailVolume: 58000,
    fedNowRailVolume: 74400,
  },
  {
    monthKey: '2025-12',
    payoutDisbursed: 145900,
    claimsResolved: 46,
    autoApprovedCount: 36,
    adjusterApprovedCount: 10,
    avgResolutionSeconds: 2.9,
    payoutByPolicy: { auto: 71000, property: 48500, health: 21400, commercial: 5000 },
    rtpRailVolume: 64000,
    fedNowRailVolume: 81900,
  },
  {
    monthKey: '2026-01',
    payoutDisbursed: 158200,
    claimsResolved: 51,
    autoApprovedCount: 41,
    adjusterApprovedCount: 10,
    avgResolutionSeconds: 2.6,
    payoutByPolicy: { auto: 78500, property: 52000, health: 22700, commercial: 5000 },
    rtpRailVolume: 72000,
    fedNowRailVolume: 86200,
  },
  {
    monthKey: '2026-02',
    payoutDisbursed: 172800,
    claimsResolved: 56,
    autoApprovedCount: 46,
    adjusterApprovedCount: 10,
    avgResolutionSeconds: 2.4,
    payoutByPolicy: { auto: 84000, property: 58800, health: 25000, commercial: 5000 },
    rtpRailVolume: 79000,
    fedNowRailVolume: 93800,
  },
  {
    monthKey: '2026-03',
    payoutDisbursed: 194500,
    claimsResolved: 63,
    autoApprovedCount: 52,
    adjusterApprovedCount: 11,
    avgResolutionSeconds: 2.2,
    payoutByPolicy: { auto: 96000, property: 66500, health: 26000, commercial: 6000 },
    rtpRailVolume: 88500,
    fedNowRailVolume: 106000,
  },
  {
    monthKey: '2026-04',
    payoutDisbursed: 208300,
    claimsResolved: 68,
    autoApprovedCount: 57,
    adjusterApprovedCount: 11,
    avgResolutionSeconds: 2.1,
    payoutByPolicy: { auto: 102000, property: 71300, health: 28000, commercial: 7000 },
    rtpRailVolume: 96000,
    fedNowRailVolume: 112300,
  },
  {
    monthKey: '2026-05',
    payoutDisbursed: 224600,
    claimsResolved: 74,
    autoApprovedCount: 62,
    adjusterApprovedCount: 12,
    avgResolutionSeconds: 2.0,
    payoutByPolicy: { auto: 110500, property: 77100, health: 30000, commercial: 7000 },
    rtpRailVolume: 104000,
    fedNowRailVolume: 120600,
  },
  {
    monthKey: '2026-06',
    payoutDisbursed: 239800,
    claimsResolved: 79,
    autoApprovedCount: 66,
    adjusterApprovedCount: 13,
    avgResolutionSeconds: 1.9,
    payoutByPolicy: { auto: 118000, property: 82000, health: 32800, commercial: 7000 },
    rtpRailVolume: 111000,
    fedNowRailVolume: 128800,
  },
  {
    monthKey: '2026-07',
    payoutDisbursed: 257100,
    claimsResolved: 84,
    autoApprovedCount: 71,
    adjusterApprovedCount: 13,
    avgResolutionSeconds: 1.8,
    payoutByPolicy: { auto: 126000, property: 88100, health: 35000, commercial: 8000 },
    rtpRailVolume: 119000,
    fedNowRailVolume: 138100,
  },
  {
    monthKey: '2026-08',
    payoutDisbursed: 271500,
    claimsResolved: 88,
    autoApprovedCount: 74,
    adjusterApprovedCount: 14,
    avgResolutionSeconds: 1.8,
    payoutByPolicy: { auto: 134000, property: 92500, health: 37000, commercial: 8000 },
    rtpRailVolume: 125000,
    fedNowRailVolume: 146500,
  },
  {
    monthKey: '2026-09',
    payoutDisbursed: 288400,
    claimsResolved: 93,
    autoApprovedCount: 78,
    adjusterApprovedCount: 15,
    avgResolutionSeconds: 1.7,
    payoutByPolicy: { auto: 142000, property: 98000, health: 39400, commercial: 9000 },
    rtpRailVolume: 133000,
    fedNowRailVolume: 155400,
  },
  {
    monthKey: '2026-10',
    payoutDisbursed: 304200,
    claimsResolved: 97,
    autoApprovedCount: 82,
    adjusterApprovedCount: 15,
    avgResolutionSeconds: 1.6,
    payoutByPolicy: { auto: 150000, property: 103200, health: 42000, commercial: 9000 },
    rtpRailVolume: 140000,
    fedNowRailVolume: 164200,
  },
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

type TimeHorizon = '6M' | 'YTD' | '12M';
type ChartViewMode = 'composite' | 'payouts' | 'resolved' | 'policy';

export const MonthlyPayoutTrendChart: React.FC<MonthlyPayoutTrendChartProps> = ({
  claims,
  selectedPolicyFilter = 'ALL',
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('6M');
  const [viewMode, setViewMode] = useState<ChartViewMode>('composite');
  const [isTableView, setIsTableView] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Merge historical operations data with live claims dynamically
  const mergedMonthlyData = useMemo(() => {
    // Clone baseline
    const map = new Map<string, MonthlyTrendDataPoint>();

    HISTORICAL_MONTHLY_BASELINES.forEach((b) => {
      const [year, monthStr] = b.monthKey.split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      const monthName = MONTH_NAMES[monthIdx];
      map.set(b.monthKey, {
        ...b,
        monthLabel: `${monthName} ${year}`,
        shortMonth: monthName,
        payoutByPolicy: { ...b.payoutByPolicy },
      });
    });

    // Incorporate live settled / approved claims from database/props
    claims.forEach((claim) => {
      if (claim.status === 'PAYOUT_SETTLED' || claim.status === 'APPROVED') {
        const dateStr = claim.payoutTransaction?.settledAt || claim.updatedAt || claim.createdAt;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const key = `${y}-${m}`;
          const existing = map.get(key);
          const payoutAmount = claim.payoutTransaction?.amount || claim.netPayout || claim.approvedAmount;

          if (existing) {
            existing.payoutDisbursed += payoutAmount;
            existing.claimsResolved += 1;
            if (claim.aiFraudRisk?.autoApproveEligible) {
              existing.autoApprovedCount += 1;
            } else {
              existing.adjusterApprovedCount += 1;
            }

            // Policy breakdown
            if (claim.policyType === 'Auto Collision') {
              existing.payoutByPolicy.auto += payoutAmount;
            } else if (claim.policyType === 'Property & Homeowners') {
              existing.payoutByPolicy.property += payoutAmount;
            } else if (claim.policyType === 'Health & Medical') {
              existing.payoutByPolicy.health += payoutAmount;
            } else {
              existing.payoutByPolicy.commercial += payoutAmount;
            }

            // Rail breakdown
            if (claim.payoutTransaction?.rail === 'FEDNOW') {
              existing.fedNowRailVolume += payoutAmount;
            } else {
              existing.rtpRailVolume += payoutAmount;
            }
          }
        }
      }
    });

    // Convert map to array sorted chronologically
    const allMonths = Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Filter by Time Horizon
    if (timeHorizon === '6M') {
      return allMonths.slice(-6);
    } else if (timeHorizon === 'YTD') {
      return allMonths.filter((m) => m.monthKey.startsWith('2026'));
    }
    return allMonths.slice(-12);
  }, [claims, timeHorizon]);

  // Summary Metrics for the active timeframe
  const summaryMetrics = useMemo(() => {
    const totalDisbursed = mergedMonthlyData.reduce((acc, m) => acc + m.payoutDisbursed, 0);
    const totalResolved = mergedMonthlyData.reduce((acc, m) => acc + m.claimsResolved, 0);
    const totalAutoApproved = mergedMonthlyData.reduce((acc, m) => acc + m.autoApprovedCount, 0);
    const avgDisbursedPerClaim = totalResolved > 0 ? totalDisbursed / totalResolved : 0;
    const stpRate = totalResolved > 0 ? (totalAutoApproved / totalResolved) * 100 : 0;

    // Month-over-month growth (last month vs month prior)
    let momGrowth = 0;
    if (mergedMonthlyData.length >= 2) {
      const latest = mergedMonthlyData[mergedMonthlyData.length - 1].payoutDisbursed;
      const prior = mergedMonthlyData[mergedMonthlyData.length - 2].payoutDisbursed;
      momGrowth = prior > 0 ? ((latest - prior) / prior) * 100 : 0;
    }

    return {
      totalDisbursed,
      totalResolved,
      avgDisbursedPerClaim,
      stpRate,
      momGrowth,
    };
  }, [mergedMonthlyData]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Payouts Disbursed ($)',
      'Claims Resolved (Count)',
      'STP Auto-Approved',
      'Adjuster Approved',
      'Auto Insurance ($)',
      'Property Insurance ($)',
      'Health Insurance ($)',
      'FedNow Volume ($)',
      'RTP Volume ($)',
    ];

    const rows = mergedMonthlyData.map((d) => [
      d.monthLabel,
      d.payoutDisbursed.toFixed(2),
      d.claimsResolved,
      d.autoApprovedCount,
      d.adjusterApprovedCount,
      d.payoutByPolicy.auto.toFixed(2),
      d.payoutByPolicy.property.toFixed(2),
      d.payoutByPolicy.health.toFixed(2),
      d.fedNowRailVolume.toFixed(2),
      d.rtpRailVolume.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClaimFlow_Monthly_Payout_Trends_${timeHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Dark Styled Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyTrendDataPoint = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[240px] pointer-events-none z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-white tracking-wide">{data.monthLabel}</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold">
              {data.avgResolutionSeconds}s avg rail latency
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Total Disbursed:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{data.payoutDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                Claims Resolved:
              </span>
              <span className="font-mono font-bold text-sky-400">
                {data.claimsResolved} claims
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-900">
              <span>STP Auto-Approved:</span>
              <span className="text-slate-200 font-mono">
                {data.autoApprovedCount} ({((data.autoApprovedCount / (data.claimsResolved || 1)) * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Adjuster Reviewed:</span>
              <span className="text-slate-200 font-mono">{data.adjusterApprovedCount}</span>
            </div>

            <div className="pt-2 mt-1 border-t border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Policy Breakdown
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div className="bg-slate-900/90 p-1 rounded border border-slate-800 text-center">
                  <div className="text-slate-400 text-[9px]">Auto</div>
                  <div className="text-blue-300 font-bold">${Math.round(data.payoutByPolicy.auto / 1000)}k</div>
                </div>
                <div className="bg-slate-900/90 p-1 rounded border border-slate-800 text-center">
                  <div className="text-slate-400 text-[9px]">Property</div>
                  <div className="text-amber-300 font-bold">${Math.round(data.payoutByPolicy.property / 1000)}k</div>
                </div>
                <div className="bg-slate-900/90 p-1 rounded border border-slate-800 text-center">
                  <div className="text-slate-400 text-[9px]">Health</div>
                  <div className="text-rose-300 font-bold">${Math.round(data.payoutByPolicy.health / 1000)}k</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <BarChart3 className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Monthly Payout & Resolution Trends
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Recharts Analytics
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated monthly payout disbursement volume ($) and claims resolved with real-time settlement velocity
              </p>
            </div>
          </div>
        </div>

        {/* Action and view controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setTimeHorizon('6M')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeHorizon === '6M'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('YTD')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeHorizon === 'YTD'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2026 YTD
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('12M')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeHorizon === '12M'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              12 Months
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => {
                setViewMode('composite');
                setIsTableView(false);
              }}
              title="Dual-axis overview (Payouts $ + Resolved Count)"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'composite' && !isTableView
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('payouts');
                setIsTableView(false);
              }}
              title="Payouts Area Chart"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'payouts' && !isTableView
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Payouts ($)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('resolved');
                setIsTableView(false);
              }}
              title="Claims Resolved Bar Chart"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'resolved' && !isTableView
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('policy');
                setIsTableView(false);
              }}
              title="Policy Breakdown"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'policy' && !isTableView
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Policy</span>
            </button>
          </div>

          {/* Table / Chart Toggle */}
          <button
            type="button"
            onClick={() => setIsTableView(!isTableView)}
            className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 ${
              isTableView
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }`}
            title={isTableView ? 'Switch to Recharts Graph' : 'Switch to Data Table'}
          >
            <Table className="w-4 h-4" />
          </button>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Export Monthly Trend CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Trend Analytics' : 'Collapse Trend Analytics'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Period Payouts</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                ${summaryMetrics.totalDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{summaryMetrics.momGrowth.toFixed(1)}% MoM velocity</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Claims Resolved</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                {summaryMetrics.totalResolved}
              </div>
              <div className="text-[11px] text-sky-300 font-semibold mt-1">
                Settled across FedNow & RTP
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Avg. Disbursed</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                ₹{Math.round(summaryMetrics.avgDisbursedPerClaim).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Per resolved case
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>STP Automation</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                {summaryMetrics.stpRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold mt-1">
                Zero-touch instant resolution
              </div>
            </div>
          </div>

          {/* Chart or Table Container */}
          {isTableView ? (
            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950">
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-4 text-right">Payouts Disbursed</th>
                    <th className="py-2.5 px-4 text-right">Claims Resolved</th>
                    <th className="py-2.5 px-4 text-right">Auto-Approved (STP)</th>
                    <th className="py-2.5 px-4 text-right">Auto Collision</th>
                    <th className="py-2.5 px-4 text-right">Property</th>
                    <th className="py-2.5 px-4 text-right">Health</th>
                    <th className="py-2.5 px-4 text-right">Avg. Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mergedMonthlyData.map((row) => (
                    <tr key={row.monthKey} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-white">{row.monthLabel}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">
                        ${row.payoutDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-sky-300 font-semibold">
                        {row.claimsResolved}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {row.autoApprovedCount} ({((row.autoApprovedCount / row.claimsResolved) * 100).toFixed(0)}%)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        ₹{row.payoutByPolicy.auto.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        ₹{row.payoutByPolicy.property.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        ₹{row.payoutByPolicy.health.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-400">
                        {row.avgResolutionSeconds}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'composite' ? (
                  <ComposedChart data={mergedMonthlyData} margin={{ top: 10, right: 12, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="payoutBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                    <XAxis
                      dataKey="shortMonth"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      yAxisId="payoutAxis"
                      stroke="#10b981"
                      tick={{ fill: '#10b981', fontSize: 11, fontFamily: 'monospace' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      axisLine={{ stroke: '#065f46' }}
                    />
                    <YAxis
                      yAxisId="resolvedAxis"
                      orientation="right"
                      stroke="#38bdf8"
                      tick={{ fill: '#38bdf8', fontSize: 11, fontFamily: 'monospace' }}
                      tickFormatter={(val) => `${val}`}
                      axisLine={{ stroke: '#0369a1' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-300 font-medium mr-3">{val}</span>}
                    />
                    <Bar
                      yAxisId="payoutAxis"
                      dataKey="payoutDisbursed"
                      name="Payouts Disbursed ($)"
                      fill="url(#payoutBarGrad)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                    <Line
                      yAxisId="resolvedAxis"
                      type="monotone"
                      dataKey="claimsResolved"
                      name="Claims Resolved (Count)"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284c7', stroke: '#bae6fd', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                ) : viewMode === 'payouts' ? (
                  <AreaChart data={mergedMonthlyData} margin={{ top: 10, right: 12, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="payoutAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                    <XAxis
                      dataKey="shortMonth"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      stroke="#10b981"
                      tick={{ fill: '#10b981', fontSize: 11, fontFamily: 'monospace' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      axisLine={{ stroke: '#065f46' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="payoutDisbursed"
                      name="Payouts Disbursed ($)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#payoutAreaGrad)"
                    />
                  </AreaChart>
                ) : viewMode === 'resolved' ? (
                  <BarChart data={mergedMonthlyData} margin={{ top: 10, right: 12, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="autoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="manualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                    <XAxis
                      dataKey="shortMonth"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-300 font-medium mr-3">{val}</span>}
                    />
                    <Bar
                      dataKey="autoApprovedCount"
                      name="STP Auto-Approved"
                      stackId="resolvedStack"
                      fill="url(#autoGrad)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="adjusterApprovedCount"
                      name="Adjuster Approved"
                      stackId="resolvedStack"
                      fill="url(#manualGrad)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                ) : (
                  <BarChart data={mergedMonthlyData} margin={{ top: 10, right: 12, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                    <XAxis
                      dataKey="shortMonth"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-300 font-medium mr-3">{val}</span>}
                    />
                    <Bar
                      dataKey="payoutByPolicy.auto"
                      name="Auto Collision ($)"
                      stackId="policyStack"
                      fill="#3b82f6"
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="payoutByPolicy.property"
                      name="Property ($)"
                      stackId="policyStack"
                      fill="#f59e0b"
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="payoutByPolicy.health"
                      name="Health ($)"
                      stackId="policyStack"
                      fill="#ec4899"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom legend / caption notes */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                <span>Primary Rail: FedNow® ($164.2k)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
                <span>Secondary Rail: RTP® ($140.0k)</span>
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time Ledger Synchronized</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
