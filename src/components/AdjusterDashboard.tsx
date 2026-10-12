import React, { useState } from 'react';
import { Claim, ClaimStatus, PolicyType } from '../types';
import { generateClaimPDFReport } from '../utils/pdfExport';
import { MonthlyPayoutTrendChart } from './MonthlyPayoutTrendChart';
import { PerformanceInsights } from './PerformanceInsights';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  FileDown,
  BarChart3,
  Layers,
  Activity,
  Plus
} from 'lucide-react';

interface AdjusterDashboardProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onAdvanceStatus: (claimId: string, nextStatus: ClaimStatus, note?: string) => Promise<void>;
  onTriggerPayout: (claim: Claim) => void;
  onOpenNewClaim: () => void;
}

export const AdjusterDashboard: React.FC<AdjusterDashboardProps> = ({
  claims,
  onSelectClaim,
  onAdvanceStatus,
  onTriggerPayout,
  onOpenNewClaim,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'insights'>('insights');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [policyFilter, setPolicyFilter] = useState<string>('ALL');
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);

  // Filter claims
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.claimant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.policyNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    const matchesPolicy = policyFilter === 'ALL' || claim.policyType === policyFilter;

    return matchesSearch && matchesStatus && matchesPolicy;
  });

  // Fast-track 1-click approval
  const handleQuickApprove = async (e: React.MouseEvent, claim: Claim) => {
    e.stopPropagation();
    setLoadingClaimId(claim.id);
    try {
      await onAdvanceStatus(
        claim.id,
        'APPROVED',
        'Senior Adjuster 1-click verified and approved based on low AI fraud score.'
      );
    } finally {
      setLoadingClaimId(null);
    }
  };

  const handleQuickPayout = (e: React.MouseEvent, claim: Claim) => {
    e.stopPropagation();
    onTriggerPayout(claim);
  };

  // Metrics
  const totalDisbursed = claims
    .filter((c) => c.status === 'PAYOUT_SETTLED')
    .reduce((acc, c) => acc + (c.payoutTransaction?.amount || c.netPayout), 0);
  const pendingApprovals = claims.filter((c) => c.status === 'ADJUSTER_ASSESSMENT' || c.status === 'DOCS_UNDER_REVIEW').length;
  const approvedAwaitingPayout = claims.filter((c) => c.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Claims Underwriting Queue</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'queue' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {filteredClaims.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'insights'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Performance Insights</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Recharts
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-1">
          {activeTab === 'queue' ? (
            <button
              type="button"
              onClick={onOpenNewClaim}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Simulate New Claim</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Back to Claims Queue</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'insights' ? (
        <PerformanceInsights claims={claims} onSelectClaim={onSelectClaim} />
      ) : (
        <div className="space-y-6">
          {/* KPI Performance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Total Capital Disbursed</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                ₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>Instant FedNow & RTP rails</span>
              </p>
            </div>

            <div
              onClick={() => setActiveTab('insights')}
              className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm hover:border-slate-700 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Average Payout Speed</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white group-hover:text-amber-300">1.8 Seconds</div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>vs. 4.2 days traditional ACH</span>
                <span className="text-amber-400 text-[10px] font-semibold">View Insights →</span>
              </p>
            </div>

            <div
              onClick={() => setActiveTab('insights')}
              className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm hover:border-slate-700 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>STP Auto-Approval Rate</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white group-hover:text-blue-300">82.4%</div>
              <p className="text-[11px] text-blue-400 mt-1 flex items-center justify-between">
                <span>Gemini OCR & fraud validation</span>
                <span className="text-blue-400 text-[10px] font-semibold">Trends →</span>
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Ready for Payout</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {approvedAwaitingPayout} Claims
              </div>
              <p className="text-[11px] text-indigo-300 mt-1">
                Awaiting 1-click dispatch
              </p>
            </div>
          </div>

          {/* Monthly Insurance Payouts & Claims Resolved Trends (Recharts) */}
          <MonthlyPayoutTrendChart claims={claims} selectedPolicyFilter={policyFilter} />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Claim #, Policy #, Claimant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DOCS_UNDER_REVIEW">Docs Review</option>
            <option value="ADJUSTER_ASSESSMENT">Assessment</option>
            <option value="APPROVED">Approved</option>
            <option value="PAYOUT_SETTLED">Settled</option>
          </select>

          {/* Policy Type Filter */}
          <select
            value={policyFilter}
            onChange={(e) => setPolicyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Policies</option>
            <option value="Auto Collision">Auto Collision</option>
            <option value="Property & Homeowners">Property & Homeowners</option>
            <option value="Health & Medical">Health & Medical</option>
          </select>
        </div>
      </div>

      {/* Claims Queue Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Active Claims Underwriting Queue</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300">
              {filteredClaims.length} records
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any row to open full forensic dossier & status tracker
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Claim ID & Policy</th>
                <th className="py-3 px-4">Claimant</th>
                <th className="py-3 px-4">Status & Progression</th>
                <th className="py-3 px-4">Claimed / Net Payout</th>
                <th className="py-3 px-4">AI Fraud Score</th>
                <th className="py-3 px-4">Docs</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No claims matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => onSelectClaim(claim)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                        {claim.claimNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {claim.policyType}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{claim.claimant.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {claim.incident.location}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {claim.status === 'PAYOUT_SETTLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Payout Settled
                        </span>
                      ) : claim.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">
                          <Sparkles className="w-3 h-3" />
                          Ready for Payout
                        </span>
                      ) : claim.status === 'ADJUSTER_ASSESSMENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60">
                          <Clock className="w-3 h-3" />
                          Assessment
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
                          {claim.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-sm">
                        ₹{claim.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gross: ₹{claim.claimedAmount.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            claim.aiFraudRisk.overallScore <= 15
                              ? 'bg-emerald-400'
                              : claim.aiFraudRisk.overallScore <= 35
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                          }`}
                        />
                        <span className="font-mono font-bold text-white">
                          {claim.aiFraudRisk.overallScore}/100
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {claim.aiFraudRisk.riskLevel} Risk
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                        {claim.documents.length} files
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateClaimPDFReport(claim);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                          title="Export Claim Dossier as PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {claim.status === 'APPROVED' ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickPayout(e, claim)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all hover:scale-[1.02]"
                          >
                            <Zap className="w-3 h-3 fill-slate-950" />
                            <span>Disburse</span>
                          </button>
                        ) : claim.status !== 'PAYOUT_SETTLED' ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprove(e, claim)}
                            disabled={loadingClaimId === claim.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                          >
                            {loadingClaimId === claim.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 font-medium px-1">
                            Clearing House Ack
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
