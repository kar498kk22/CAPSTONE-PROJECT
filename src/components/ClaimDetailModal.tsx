import React, { useState } from 'react';
import { Claim, ClaimDocument, ClaimStatus } from '../types';
import { StatusTracker } from './StatusTracker';
import { DocumentUploadModal } from './DocumentUploadModal';
import { AuditTrail } from './AuditTrail';
import { generateClaimPDFReport } from '../utils/pdfExport';
import {
  X,
  FileText,
  Upload,
  Building2,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  FileCheck,
  FileDown
} from 'lucide-react';

interface ClaimDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim;
  onAdvanceStatus: (claimId: string, nextStatus: ClaimStatus, note?: string) => Promise<void>;
  onTriggerPayout: (claim: Claim) => void;
  onAddDocumentToClaim: (claimId: string, doc: ClaimDocument) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  isOpen,
  onClose,
  claim,
  onAdvanceStatus,
  onTriggerPayout,
  onAddDocumentToClaim,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline' | 'settlement'>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<ClaimDocument | null>(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const handleCopyTrace = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPdf(true);
      generateClaimPDFReport(claim, {
        includeAuditTrail: true,
        includeFinancialSummary: true,
        includeDocumentsList: true,
        includeFraudRiskForensics: true,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              {claim.claimNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{claim.policyType} Claim</h3>
                <span className="text-xs text-slate-400 font-mono">({claim.policyNumber})</span>
              </div>
              <p className="text-xs text-slate-400">Claimant: {claim.claimant.name} • {claim.incident.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              title="Export structured claim dossier & audit trail as PDF"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Export PDF</span>
                </>
              )}
            </button>

            {claim.status === 'APPROVED' && (
              <button
                onClick={() => onTriggerPayout(claim)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 transition-all hover:scale-[1.02]"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Instant Payout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lifecycle Overview
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Supporting Documents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {claim.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'settlement'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Banking & Settlement
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {claim.timeline.length + claim.documents.length + (claim.payoutTransaction ? 1 : 0)}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Automated Status Tracker Component */}
              <StatusTracker
                claim={claim}
                onAdvanceStatus={onAdvanceStatus}
                onTriggerPayout={onTriggerPayout}
              />

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Financial Summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Financial Summary
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Claimed Amount:</span>
                      <span className="font-mono text-white">₹{claim.claimedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Deductible:</span>
                      <span className="font-mono text-red-400">-₹{claim.deductible.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                      <span>Net Settlement:</span>
                      <span className="font-mono text-emerald-400 text-sm">
                        ${claim.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Forensic Risk Engine */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      AI Fraud Risk
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Score: {claim.aiFraudRisk.overallScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {claim.aiFraudRisk.reasoning}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Auto-Disbursement Certified</span>
                  </div>
                </div>

                {/* Banking Rails Destination */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Banking Rails
                  </span>
                  <div className="text-xs text-white font-semibold truncate">
                    {claim.bankDetails?.bankName || 'JPMorgan Chase Bank, N.A.'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Routing: {claim.bankDetails?.routingNumber || '021000021'} • {claim.bankDetails?.accountNumberMasked || '•••• 8914'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    <span>RTP & FedNow Instant Active</span>
                  </div>
                </div>
              </div>

              {/* Incident Context */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Incident Report Narrative</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  {claim.incident.description}
                </p>
                <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Occurred: <strong className="text-white">{claim.incident.date}</strong></span>
                  <span>Location: <strong className="text-white">{claim.incident.location}</strong></span>
                  <span>Policyholder Contact: <strong className="text-white">{claim.claimant.phone}</strong></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Supporting Documentation Repository</h4>
                  <p className="text-[11px] text-slate-400">
                    All documents undergo automated multimodal OCR extraction and tamper analysis.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {claim.documents.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No supporting documents attached yet.</p>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Click to upload bills, estimates or photos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {claim.documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocPreview(doc)}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white group-hover:text-blue-300 truncate block">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.category} • {doc.size}
                            </span>
                          </div>
                        </div>

                        {doc.aiAnalysis && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                            AI Verified
                          </span>
                        )}
                      </div>

                      {doc.aiAnalysis && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span>Extracted Total:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              ₹{doc.aiAnalysis.extractedAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Vendor/Shop:</span>
                            <span className="text-slate-200 truncate max-w-[150px]">{doc.aiAnalysis.vendorName}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Fraud Score:</span>
                            <span className="font-mono text-emerald-400 font-bold">{doc.aiAnalysis.fraudScore}/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Document Inspector Drawer (if clicked) */}
              {selectedDocPreview && selectedDocPreview.aiAnalysis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-xs font-bold text-white">{selectedDocPreview.name} Forensic Audit</h5>
                    </div>
                    <button
                      onClick={() => setSelectedDocPreview(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold block">Audit Checkpoints:</span>
                    {selectedDocPreview.aiAnalysis.flagSummary.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settlement' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Banking Settlement Channel</h4>
                      <p className="text-xs text-slate-400">Direct integration via FedNow Service and RTP Network</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Bank Name</span>
                    <span className="font-semibold text-white">{claim.bankDetails?.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">ABA Routing</span>
                    <span className="font-mono text-white">{claim.bankDetails?.routingNumber}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account</span>
                    <span className="font-mono text-white">{claim.bankDetails?.accountNumberMasked}</span>
                  </div>
                </div>

                {claim.payoutTransaction && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/60 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Disbursement Confirmed
                      </span>
                      <span>₹{claim.payoutTransaction.amount.toLocaleString()}</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Transaction ID:</span>
                        <span className="text-white">{claim.payoutTransaction.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Settlement Rail:</span>
                        <span className="text-emerald-400 font-bold">{claim.payoutTransaction.rail} (Instant)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">FedNow Trace ID:</span>
                        <div className="flex items-center gap-1 text-white">
                          <span>{claim.payoutTransaction.fedNowTraceId}</span>
                          <button
                            onClick={() => handleCopyTrace(claim.payoutTransaction?.fedNowTraceId || '')}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            {copiedTrace ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Settlement Latency:</span>
                        <span className="text-white font-bold">{claim.payoutTransaction.latencySeconds}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <AuditTrail
              claim={claim}
              onOpenDocPreview={(doc) => setSelectedDocPreview(doc)}
            />
          )}
        </div>
      </div>

      {/* Embedded Document Uploader Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddDocument={(doc) => onAddDocumentToClaim(claim.id, doc)}
        claimId={claim.id}
      />
    </div>
  );
};
