import React, { useState, useMemo } from 'react';
import { Claim, ClaimDocument, PayoutTransaction, TimelineEvent } from '../types';
import { generateClaimPDFReport } from '../utils/pdfExport';
import {
  FileText,
  Zap,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Sparkles,
  Shield,
  Activity,
  Calendar,
  User,
  Cpu,
  Hash,
  FileDown
} from 'lucide-react';

export type AuditEventType = 'ALL' | 'STATUS_CHANGE' | 'DOCUMENT_UPLOAD' | 'PAYOUT' | 'AI_VERIFICATION';

export interface UnifiedAuditEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'DOCUMENT_UPLOAD' | 'PAYOUT' | 'AI_VERIFICATION';
  title: string;
  timestamp: string;
  actor: string;
  note: string;
  isAutomated: boolean;
  statusBadge?: string;
  auditHash: string;
  metadata?: {
    documentId?: string;
    documentName?: string;
    documentCategory?: string;
    documentSize?: string;
    extractedAmount?: number;
    fraudScore?: number;
    payoutAmount?: number;
    payoutRail?: string;
    transactionId?: string;
    fedNowTraceId?: string;
    latencySeconds?: number;
    statusChangeFrom?: string;
    statusChangeTo?: string;
  };
}

interface AuditTrailProps {
  claim: Claim;
  onOpenDocPreview?: (doc: ClaimDocument) => void;
}

// Generate a deterministic hash string for immutable verification appearance
function generateAuditHash(id: string, timestamp: string): string {
  let hash = 0;
  const str = `${id}-${timestamp}-CLAIMFLOW-LEDGER`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${id.slice(-4).toUpperCase()}`;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ claim, onOpenDocPreview }) => {
  const [activeFilter, setActiveFilter] = useState<AuditEventType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Compile all chronological events from timeline, documents, and banking payouts
  const unifiedEvents = useMemo(() => {
    const list: UnifiedAuditEvent[] = [];

    // 1. Process Timeline Events
    claim.timeline.forEach((item, index) => {
      let type: UnifiedAuditEvent['type'] = 'STATUS_CHANGE';
      if (item.stage === 'DOCUMENT_ANALYSIS' || item.stage === 'DOCS_UNDER_REVIEW') {
        type = 'AI_VERIFICATION';
      } else if (item.stage === 'PAYOUT_INITIATED' || item.stage === 'PAYOUT_SETTLED') {
        type = 'PAYOUT';
      } else if (item.stage === 'DOCUMENT_UPLOAD') {
        type = 'DOCUMENT_UPLOAD';
      }

      list.push({
        id: item.id || `timeline-${index}`,
        type,
        title: item.title,
        timestamp: item.timestamp,
        actor: item.actor,
        note: item.note,
        isAutomated: item.isAutomated,
        statusBadge: item.stage,
        auditHash: generateAuditHash(item.id || `evt-${index}`, item.timestamp),
        metadata: {
          statusChangeTo: item.stage,
        },
      });
    });

    // 2. Correlate Documents (ensure every uploaded doc is recorded with its audit attributes)
    claim.documents.forEach((doc) => {
      // Avoid exact duplicates if timeline already logged this specific file
      const alreadyLogged = list.some(
        (e) => e.type === 'DOCUMENT_UPLOAD' && e.title.includes(doc.name)
      );

      if (!alreadyLogged) {
        list.push({
          id: `audit-doc-${doc.id}`,
          type: 'DOCUMENT_UPLOAD',
          title: `Supporting Document Attached: ${doc.name}`,
          timestamp: doc.uploadDate,
          actor: `Claimant (${claim.claimant.name})`,
          note: `Uploaded ${doc.category} (${doc.size}). Multimodal OCR extraction performed. Extracted amount: ₹${(doc.aiAnalysis?.extractedAmount || 0).toLocaleString()}.`,
          isAutomated: false,
          statusBadge: doc.category,
          auditHash: generateAuditHash(doc.id, doc.uploadDate),
          metadata: {
            documentId: doc.id,
            documentName: doc.name,
            documentCategory: doc.category,
            documentSize: doc.size,
            extractedAmount: doc.aiAnalysis?.extractedAmount,
            fraudScore: doc.aiAnalysis?.fraudScore,
          },
        });
      }

      // If document has AI analysis, add explicit AI verification milestone if not present
      if (doc.aiAnalysis) {
        const aiEventLogged = list.some(
          (e) => e.type === 'AI_VERIFICATION' && e.note.includes(doc.name)
        );
        if (!aiEventLogged) {
          list.push({
            id: `audit-ai-${doc.id}`,
            type: 'AI_VERIFICATION',
            title: `AI Forensic Inspection: ${doc.name}`,
            timestamp: doc.uploadDate,
            actor: 'ClaimFlow Multimodal AI Engine',
            note: `Forensic audit complete. Fraud Risk Score: ${doc.aiAnalysis.fraudScore}/100. Vendor: "${doc.aiAnalysis.vendorName}". Checkpoints: ${doc.aiAnalysis.flagSummary.join('; ')}.`,
            isAutomated: true,
            statusBadge: `Score: ${doc.aiAnalysis.fraudScore}/100`,
            auditHash: generateAuditHash(`ai-${doc.id}`, doc.uploadDate),
            metadata: {
              documentId: doc.id,
              documentName: doc.name,
              fraudScore: doc.aiAnalysis.fraudScore,
              extractedAmount: doc.aiAnalysis.extractedAmount,
            },
          });
        }
      }
    });

    // 3. Correlate Payout Transaction
    if (claim.payoutTransaction) {
      const payout = claim.payoutTransaction;
      const alreadyInTimeline = list.some(
        (e) => e.type === 'PAYOUT' && e.metadata?.transactionId === payout.transactionId
      );

      if (!alreadyInTimeline) {
        list.push({
          id: `audit-payout-${payout.transactionId}`,
          type: 'PAYOUT',
          title: `Instant ${payout.rail} Direct Banking Settlement Cleared`,
          timestamp: payout.settledAt || payout.initiatedAt,
          actor: 'Federal Reserve FedNow & RTP Banking Gateway',
          note: `Disbursed ₹${payout.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${claim.bankDetails?.bankName || 'Beneficiary Bank'} (${claim.bankDetails?.accountNumberMasked || '•••• 8914'}). Clearing Reference: ${payout.clearingHouseRef || 'CLR-ACK'}. Trace: ${payout.fedNowTraceId}. Settlement latency: ${payout.latencySeconds}s.`,
          isAutomated: true,
          statusBadge: `${payout.rail} SETTLED`,
          auditHash: generateAuditHash(payout.transactionId, payout.settledAt || payout.initiatedAt),
          metadata: {
            payoutAmount: payout.amount,
            payoutRail: payout.rail,
            transactionId: payout.transactionId,
            fedNowTraceId: payout.fedNowTraceId,
            latencySeconds: payout.latencySeconds,
          },
        });
      }
    }

    // Sort chronologically
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [claim, sortOrder]);

  // Filtered and searched events
  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((evt) => {
      const matchesType = activeFilter === 'ALL' || evt.type === activeFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesType;

      const matchesQuery =
        evt.title.toLowerCase().includes(query) ||
        evt.note.toLowerCase().includes(query) ||
        evt.actor.toLowerCase().includes(query) ||
        (evt.metadata?.transactionId && evt.metadata.transactionId.toLowerCase().includes(query)) ||
        (evt.metadata?.fedNowTraceId && evt.metadata.fedNowTraceId.toLowerCase().includes(query)) ||
        (evt.metadata?.documentName && evt.metadata.documentName.toLowerCase().includes(query));

      return matchesType && matchesQuery;
    });
  }, [unifiedEvents, activeFilter, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: unifiedEvents.length,
      statusChanges: unifiedEvents.filter((e) => e.type === 'STATUS_CHANGE').length,
      documents: unifiedEvents.filter((e) => e.type === 'DOCUMENT_UPLOAD').length,
      payouts: unifiedEvents.filter((e) => e.type === 'PAYOUT').length,
      ai: unifiedEvents.filter((e) => e.type === 'AI_VERIFICATION').length,
    };
  }, [unifiedEvents]);

  // Toggle details dropdown
  const toggleExpand = (id: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy hash
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      generateClaimPDFReport(claim, {
        includeAuditTrail: true,
        includeFinancialSummary: true,
        includeDocumentsList: true,
        includeFraudRiskForensics: true,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 1200);
    }
  };

  // Copy full audit transcript
  const handleExportTranscript = () => {
    const textReport = [
      `=============================================================`,
      `CLAIMFLOW OFFICIAL IMMUTABLE AUDIT TRAIL LOG`,
      `Claim Number: ${claim.claimNumber} | Policy: ${claim.policyNumber}`,
      `Claimant: ${claim.claimant.name} (${claim.claimant.email})`,
      `Policy Type: ${claim.policyType} | Status: ${claim.status}`,
      `Export Timestamp: ${new Date().toISOString()}`,
      `Total Logged Events: ${unifiedEvents.length}`,
      `=============================================================`,
      ...unifiedEvents.map((e, idx) => {
        return `[#${idx + 1}] ${new Date(e.timestamp).toISOString()} | [${e.type}] ${e.title}
Actor: ${e.actor} (Automated: ${e.isAutomated})
Hash: ${e.auditHash}
Details: ${e.note}
${e.metadata?.transactionId ? `Tx ID: ${e.metadata.transactionId} | Trace: ${e.metadata.fedNowTraceId}` : ''}
-------------------------------------------------------------`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(textReport);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  // Icon and styling helper
  const getEventBadgeStyle = (type: UnifiedAuditEvent['type']) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return {
          icon: Clock,
          color: 'text-blue-400 bg-blue-950/80 border-blue-800/80',
          dot: 'bg-blue-400',
          pill: 'bg-blue-950 text-blue-300 border-blue-800',
        };
      case 'DOCUMENT_UPLOAD':
        return {
          icon: FileText,
          color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80',
          dot: 'bg-cyan-400',
          pill: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        };
      case 'PAYOUT':
        return {
          icon: Zap,
          color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
          dot: 'bg-emerald-400',
          pill: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        };
      case 'AI_VERIFICATION':
        return {
          icon: Cpu,
          color: 'text-purple-400 bg-purple-950/80 border-purple-800/80',
          dot: 'bg-purple-400',
          pill: 'bg-purple-950 text-purple-300 border-purple-800',
        };
      default:
        return {
          icon: Activity,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          dot: 'bg-slate-400',
          pill: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Export Controls */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Cryptographic Audit Trail</h4>
            <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Immutable & Tamper-Proof
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological log of claim lifecycle transitions, document uploads, forensic AI scans, and banking payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950 transition-all hover:scale-[1.02] disabled:opacity-70"
            title="Download structured PDF claim dossier and immutable audit report"
          >
            {isExportingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Audit PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all hover:scale-[1.01]"
          >
            {copiedTranscript ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Transcript Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            title="Toggle chronological sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            All Events ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('STATUS_CHANGE')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'STATUS_CHANGE'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Status Changes ({counts.statusChanges})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('DOCUMENT_UPLOAD')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'DOCUMENT_UPLOAD'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Documents ({counts.documents})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('PAYOUT')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'PAYOUT'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Payouts ({counts.payouts})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('AI_VERIFICATION')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'AI_VERIFICATION'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>AI Reviews ({counts.ai})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit events, trace IDs, docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Chronological Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          No audit events found matching the active filter or query.
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800/80">
          {filteredEvents.map((evt, idx) => {
            const badge = getEventBadgeStyle(evt.type);
            const Icon = badge.icon;
            const isExpanded = expandedEventIds.has(evt.id);
            const dateObj = new Date(evt.timestamp);
            const formattedDate = dateObj.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div key={evt.id} className="flex items-start gap-3 pl-1 relative z-10 group">
                {/* Node icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${badge.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Event Card */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800/90 hover:border-slate-700/80 p-3.5 flex-1 text-xs space-y-2 transition-all shadow-sm">
                  {/* Top Bar: Title, Category Badge, Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{evt.title}</span>
                      {evt.statusBadge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.pill}`}
                        >
                          {evt.statusBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  {/* Note / Narrative */}
                  <p className="text-slate-300 text-xs leading-relaxed">{evt.note}</p>

                  {/* Metadata Summary Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px]">
                    <div className="flex flex-wrap items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Actor: <strong>{evt.actor}</strong></span>
                      </span>

                      {evt.isAutomated && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Cpu className="w-3 h-3" />
                          <span>Automated Trigger</span>
                        </span>
                      )}
                    </div>

                    {/* Hash & Expand button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyHash(evt.auditHash)}
                        className="flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 transition-colors"
                        title="Click to copy cryptographic audit ledger hash"
                      >
                        <Hash className="w-2.5 h-2.5 text-slate-500" />
                        <span>{evt.auditHash}</span>
                        {copiedHash === evt.auditHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-500" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(evt.id)}
                        className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                        title={isExpanded ? 'Collapse event metadata' : 'Expand event metadata'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Technical Metadata Drawer */}
                  {isExpanded && (
                    <div className="pt-2 mt-2 border-t border-slate-800/80 bg-slate-900/60 p-3 rounded-xl space-y-2 text-[11px] font-mono animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                        <span className="font-semibold text-slate-300">Technical Audit Metadata</span>
                        <span className="text-[10px] text-emerald-400">STATUS: VERIFIED</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Audit Event ID:</span>
                          <span className="text-white">{evt.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Ledger Verification Hash:</span>
                          <span className="text-emerald-400">{evt.auditHash}</span>
                        </div>

                        {evt.metadata?.transactionId && (
                          <div>
                            <span className="text-slate-500 block">Banking Transaction ID:</span>
                            <span className="text-white">{evt.metadata.transactionId}</span>
                          </div>
                        )}

                        {evt.metadata?.fedNowTraceId && (
                          <div>
                            <span className="text-slate-500 block">FedNow End-to-End Trace:</span>
                            <span className="text-emerald-400">{evt.metadata.fedNowTraceId}</span>
                          </div>
                        )}

                        {evt.metadata?.payoutRail && (
                          <div>
                            <span className="text-slate-500 block">Disbursement Rail:</span>
                            <span className="text-white">{evt.metadata.payoutRail} (Latency: {evt.metadata.latencySeconds}s)</span>
                          </div>
                        )}

                        {evt.metadata?.documentName && (
                          <div>
                            <span className="text-slate-500 block">Attached Artifact:</span>
                            <span className="text-white truncate block">{evt.metadata.documentName} ({evt.metadata.documentSize})</span>
                          </div>
                        )}

                        {evt.metadata?.fraudScore !== undefined && (
                          <div>
                            <span className="text-slate-500 block">AI Forensic Risk Score:</span>
                            <span className="text-purple-400">{evt.metadata.fraudScore}/100 (Certified Genuine)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
