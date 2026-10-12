import React, { useState } from 'react';
import { Claim, ClaimStatus } from '../types';
import { Check, Clock, ShieldCheck, Zap, ArrowRight, Building, FileSearch, Sparkles, RefreshCw } from 'lucide-react';

interface StatusTrackerProps {
  claim: Claim;
  onAdvanceStatus?: (claimId: string, nextStatus: ClaimStatus, note?: string) => Promise<void>;
  onTriggerPayout?: (claim: Claim) => void;
  compact?: boolean;
}

const STAGES: {
  status: ClaimStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  automatedNotice: string;
}[] = [
  {
    status: 'SUBMITTED',
    title: 'Claim Lodged',
    subtitle: 'Policy & incident intake',
    icon: Clock,
    automatedNotice: 'Policy verification validated in 0.8s',
  },
  {
    status: 'DOCS_UNDER_REVIEW',
    title: 'AI Document Verification',
    subtitle: 'OCR & forensic anomaly scan',
    icon: FileSearch,
    automatedNotice: 'Gemini multimodal forensic parsing & fraud check',
  },
  {
    status: 'ADJUSTER_ASSESSMENT',
    title: 'Technical Assessment',
    subtitle: 'Settlement calculation & review',
    icon: ShieldCheck,
    automatedNotice: 'STP auto-approval rule evaluated',
  },
  {
    status: 'APPROVED',
    title: 'Claim Approved',
    subtitle: 'Settlement ready for payout',
    icon: Sparkles,
    automatedNotice: 'Ready for instant banking rail dispatch',
  },
  {
    status: 'PAYOUT_SETTLED',
    title: 'Banking Payout Cleared',
    subtitle: 'RTP® / FedNow® instant deposit',
    icon: Building,
    automatedNotice: 'Funds settled irrevocably in beneficiary bank',
  },
];

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  claim,
  onAdvanceStatus,
  onTriggerPayout,
  compact = false,
}) => {
  const [isAutomating, setIsAutomating] = useState(false);
  const [autoProgressText, setAutoProgressText] = useState('');

  // Map status to 0..4 index
  const getStageIndex = (status: ClaimStatus): number => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'SUBMITTED':
        return 0;
      case 'DOCS_UNDER_REVIEW':
        return 1;
      case 'ADJUSTER_ASSESSMENT':
        return 2;
      case 'APPROVED':
        return 3;
      case 'PAYOUT_INITIATED':
        return 3;
      case 'PAYOUT_SETTLED':
        return 4;
      case 'REJECTED':
        return 2;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(claim.status);

  // Fast-Track Auto-Processing runner
  const handleAutoFastTrack = async () => {
    if (!onAdvanceStatus) return;
    setIsAutomating(true);

    try {
      if (currentIndex === 0) {
        setAutoProgressText('Running Gemini OCR Document Verification...');
        await new Promise((r) => setTimeout(r, 1200));
        await onAdvanceStatus(claim.id, 'DOCS_UNDER_REVIEW', 'Automated OCR & forensic document verification initiated.');
        
        setAutoProgressText('Assessing fraud score & coverage rules...');
        await new Promise((r) => setTimeout(r, 1200));
        await onAdvanceStatus(claim.id, 'APPROVED', 'Fast-Track Straight-Through Processing: AI Fraud score is low (verified).');
      } else if (currentIndex === 1) {
        setAutoProgressText('Evaluating settlement calculations...');
        await new Promise((r) => setTimeout(r, 1000));
        await onAdvanceStatus(claim.id, 'APPROVED', 'Document review completed with 97% confidence. Approved for disbursement.');
      } else if (currentIndex === 2) {
        setAutoProgressText('Approving settlement amount...');
        await new Promise((r) => setTimeout(r, 900));
        await onAdvanceStatus(claim.id, 'APPROVED', 'Adjuster verified all line items and approved claim.');
      }

      if (currentIndex < 4 && onTriggerPayout) {
        setAutoProgressText('Initiating Instant FedNow / RTP Banking Payout...');
        await new Promise((r) => setTimeout(r, 900));
        onTriggerPayout(claim);
      }
    } finally {
      setIsAutomating(false);
      setAutoProgressText('');
    }
  };

  return (
    <div className={`bg-slate-900/80 rounded-2xl border border-slate-800 p-5 ${compact ? 'shadow-sm' : 'shadow-xl'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
              {claim.claimNumber}
            </span>
            <h3 className="text-base font-bold text-white">Automated Claim Lifecycle Tracking</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stage orchestration with automated document inspection & instant banking dispatch.
          </p>
        </div>

        {/* Fast-track automation trigger button */}
        {claim.status !== 'PAYOUT_SETTLED' && onAdvanceStatus && (
          <button
            onClick={handleAutoFastTrack}
            disabled={isAutomating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isAutomating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{autoProgressText || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Simulate Automated Fast-Track</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Visual Stepper */}
      <div className="relative">
        <div className="hidden md:grid grid-cols-5 gap-3 relative">
          {/* Connector bar */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-800 -z-0">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${(currentIndex / 4) * 100}%` }}
            />
          </div>

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.status} className="flex flex-col items-center text-center relative z-10">
                {/* Circle Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-950/60'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-950 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stage.subtitle}</p>

                  {/* Stage-specific tag */}
                  {isCurrent && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/80">
                      In Progress
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="md:hidden space-y-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = stage.icon;

            return (
              <div
                key={stage.status}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-950/30 border-blue-700/60'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{stage.title}</span>
                    {isCurrent && <span className="text-[10px] text-blue-400 font-semibold">Active</span>}
                    {isCompleted && <span className="text-[10px] text-emerald-400 font-semibold">Completed</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stage.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Context & Next Actions Bar */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/50">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-slate-400">Current Phase:</span>
          <span className="font-bold text-white">
            {claim.status === 'PAYOUT_SETTLED'
              ? 'Settled & Transferred (FedNow/RTP Cleared)'
              : claim.status === 'APPROVED'
              ? 'Approved - Awaiting Banking API Payout'
              : claim.status === 'ADJUSTER_ASSESSMENT'
              ? 'Under Adjuster Technical Review'
              : claim.status === 'DOCS_UNDER_REVIEW'
              ? 'Automated Document Extraction in Progress'
              : 'Claim Submitted & Policy Validated'}
          </span>
        </div>

        {/* Action Button for Next Stage */}
        <div className="flex items-center gap-2">
          {claim.status === 'APPROVED' && onTriggerPayout && (
            <button
              onClick={() => onTriggerPayout(claim)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Dispatch Instant Payout</span>
            </button>
          )}

          {claim.status === 'PAYOUT_SETTLED' && claim.payoutTransaction && (
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Settled in {claim.payoutTransaction.latencySeconds}s via {claim.payoutTransaction.rail}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
