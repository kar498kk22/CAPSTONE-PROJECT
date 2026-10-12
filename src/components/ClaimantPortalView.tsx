import React, { useState } from 'react';
import { Claim, ClaimDocument, ClaimStatus, User as UserType } from '../types';
import { StatusTracker } from './StatusTracker';
import { DocumentUploadModal } from './DocumentUploadModal';
import { generateClaimPDFReport } from '../utils/pdfExport';
import {
  Shield,
  FileText,
  Upload,
  Zap,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  LogIn,
  UserPlus,
  FileDown
} from 'lucide-react';

interface ClaimantPortalViewProps {
  claims: Claim[];
  selectedClaimId: string;
  onSelectClaim: (claim: Claim) => void;
  onOpenNewClaim: () => void;
  onAdvanceStatus: (claimId: string, nextStatus: ClaimStatus, note?: string) => Promise<void>;
  onTriggerPayout: (claim: Claim) => void;
  onAddDocumentToClaim: (claimId: string, doc: ClaimDocument) => void;
  currentUser: UserType | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onViewClaimDetail?: (claim: Claim) => void;
}

export const ClaimantPortalView: React.FC<ClaimantPortalViewProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim,
  onOpenNewClaim,
  onAdvanceStatus,
  onTriggerPayout,
  onAddDocumentToClaim,
  currentUser,
  onOpenAuthModal,
  onViewClaimDetail,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filter claims if user is logged in as policyholder
  const userClaims = currentUser
    ? claims.filter(
        (c) =>
          (currentUser.email && c.claimant.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.phone && c.claimant.phone.replace(/\D/g, '').includes(currentUser.phone.replace(/\D/g, ''))) ||
          c.claimant.name.toLowerCase() === currentUser.name.toLowerCase()
      )
    : claims;

  // If user has claims, pick selected or first; otherwise fallback to general claims for demo checking
  const displayClaims = userClaims.length > 0 ? userClaims : claims;
  const activeClaim = displayClaims.find((c) => c.id === selectedClaimId) || displayClaims[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Claimant Portal
              </span>
              <span className="text-xs text-slate-400">
                {currentUser ? `Welcome back, ${currentUser.name}` : `Guest Policyholder`}
              </span>
              {currentUser && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Logged in as {currentUser.username}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Track Your Claim & Receive Instant Payouts
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Upload supporting invoices or photos. Our automated AI engine verifies documents in seconds and triggers direct FedNow® & RTP® banking payouts immediately upon approval.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!currentUser ? (
              <button
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In / Sign Up</span>
              </button>
            ) : null}

            <button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={!activeClaim}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Upload Documents</span>
            </button>

            <button
              onClick={onOpenNewClaim}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Claim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State for Newly Registered User without claims yet */}
      {currentUser && userClaims.length === 0 && (
        <div className="bg-slate-900/90 rounded-3xl border border-emerald-500/40 p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Welcome, {currentUser.name}!</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
              Your new account is ready. File your first insurance claim to experience instant AI document verification and real-time banking settlement.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenNewClaim}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>File Your First Claim</span>
            </button>
            <button
              onClick={() => {
                if (claims.length > 0) onSelectClaim(claims[0]);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              View Sample Pre-Loaded Claim
            </button>
          </div>
        </div>
      )}

      {/* Claim Switcher Pills */}
      {displayClaims.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Your Claims:</span>
          {displayClaims.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectClaim(c)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                c.id === activeClaim?.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="font-mono">{c.claimNumber}</span>
              <span className="text-[10px] opacity-80">({c.policyType})</span>
              {c.status === 'PAYOUT_SETTLED' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {activeClaim && (
        <>
          {/* Quick claim bar with Audit Trail CTA and PDF Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                {activeClaim.claimNumber}
              </span>
              <span className="font-semibold text-white">{activeClaim.policyType}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline font-mono">Policy #{activeClaim.policyNumber}</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => generateClaimPDFReport(activeClaim)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-[1.01]"
                title="Download official structured claim PDF dossier"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-400" />
                <span>Export PDF</span>
              </button>

              {onViewClaimDetail && (
                <button
                  type="button"
                  onClick={() => onViewClaimDetail(activeClaim)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all hover:scale-[1.01]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Status Tracker */}
          <StatusTracker
            claim={activeClaim}
            onAdvanceStatus={onAdvanceStatus}
            onTriggerPayout={onTriggerPayout}
          />

          {/* 2-Column Details: Supporting Docs + Banking Coordinates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supporting Documents Section */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Supporting Documentation</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono">
                    {activeClaim.documents.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 border border-blue-800/60 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>
              </div>

              {activeClaim.documents.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">No documents attached yet.</p>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Upload repair estimate or invoice
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeClaim.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block">{doc.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {doc.category} • {doc.size}
                          </span>
                        </div>
                      </div>

                      {doc.aiAnalysis ? (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400 block">
                            ₹{doc.aiAnalysis.extractedAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                            OCR Verified
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Processing...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Banking Payout Channel Section */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Instant Banking Rails</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  FedNow & RTP Active
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Linked Payout Account:</span>
                  <span className="text-xs font-bold text-white">{activeClaim.bankDetails?.bankName}</span>
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-slate-300">
                  <span className="text-slate-400">Routing Number:</span>
                  <span>{activeClaim.bankDetails?.routingNumber}</span>
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-slate-300">
                  <span className="text-slate-400">Account Number:</span>
                  <span>{activeClaim.bankDetails?.accountNumberMasked}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Plaid Verified
                  </span>
                </div>
              </div>

              {/* Settlement Payout Action */}
              {activeClaim.status === 'APPROVED' ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">Claim Approved!</span>
                      <span className="text-emerald-400">
                        Net Approved Settlement: ${activeClaim.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      onClick={() => onTriggerPayout(activeClaim)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 transition-all hover:scale-[1.02]"
                    >
                      Receive Payout Now
                    </button>
                  </div>
                </div>
              ) : activeClaim.status === 'PAYOUT_SETTLED' ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/60 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Funds Deposited in Your Account</span>
                    <span>${activeClaim.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Trace: {activeClaim.payoutTransaction?.fedNowTraceId}</span>
                    <span className="text-emerald-400">Settled in {activeClaim.payoutTransaction?.latencySeconds}s</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  Once your documentation review completes, payouts are released instantly via Federal Reserve FedNow directly into this account within seconds.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Upload Document Modal */}
      {activeClaim && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAddDocument={(doc) => onAddDocumentToClaim(activeClaim.id, doc)}
          claimId={activeClaim.id}
        />
      )}
    </div>
  );
};
