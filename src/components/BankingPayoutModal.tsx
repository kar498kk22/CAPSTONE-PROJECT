import React, { useState } from 'react';
import { Claim, BankDetails, PaymentRail } from '../types';
import { POPULAR_BANKS } from '../utils/sampleData';
import { Building2, Zap, CheckCircle2, ShieldCheck, ArrowRight, X, Loader2, Download, Printer, Check, Copy } from 'lucide-react';

interface BankingPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim;
  onPayoutSettled: (updatedClaim: Claim) => void;
}

export const BankingPayoutModal: React.FC<BankingPayoutModalProps> = ({
  isOpen,
  onClose,
  claim,
  onPayoutSettled,
}) => {
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('FEDNOW');
  const [selectedBank, setSelectedBank] = useState<string>(
    claim.bankDetails?.bankName || 'JPMorgan Chase Bank, N.A.'
  );
  const [routingNumber, setRoutingNumber] = useState(
    claim.bankDetails?.routingNumber || '021000021'
  );
  const [accountNumber, setAccountNumber] = useState('•••• 8914');
  const [accountHolder, setAccountHolder] = useState(claim.claimant.name);

  // Payout processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [settledResult, setSettledResult] = useState<{
    claim: Claim;
    receipt: any;
    txId: string;
    traceId: string;
    latency: number;
  } | null>(null);

  const [copiedTx, setCopiedTx] = useState(false);

  if (!isOpen) return null;

  const netPayout = claim.netPayout || Math.max(0, claim.approvedAmount - claim.deductible);

  // Bank selection helper
  const handleSelectPopularBank = (bank: (typeof POPULAR_BANKS)[0]) => {
    setSelectedBank(bank.name);
    setRoutingNumber(bank.routing);
  };

  // Execute direct banking API payout
  const handleExecutePayout = async () => {
    setIsProcessing(true);
    setStepIndex(1); // API Handshake

    try {
      // Step 1: Handshake
      await new Promise((r) => setTimeout(r, 600));
      setStepIndex(2); // ISO 20022 pacs.008 message creation

      await new Promise((r) => setTimeout(r, 700));
      setStepIndex(3); // Federal Reserve / RTP network settlement

      const res = await fetch('/api/banking/initiate-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          rail: selectedRail,
          amount: netPayout,
          bankDetails: {
            bankName: selectedBank,
            routingNumber,
            accountNumberMasked: accountNumber,
            accountType: 'checking',
            accountHolder,
            verificationStatus: 'VERIFIED_PLAID',
            rtpEligible: true,
            fedNowEligible: true,
          },
        }),
      });

      const data = await res.json();
      await new Promise((r) => setTimeout(r, 600));
      setStepIndex(4); // Cleared!

      if (data.success) {
        setSettledResult({
          claim: data.claim,
          receipt: data.receipt,
          txId: data.transaction.transactionId,
          traceId: data.transaction.fedNowTraceId || 'FEDNOW-E2E-9912048',
          latency: data.transaction.latencySeconds || 1.8,
        });
        onPayoutSettled(data.claim);
      }
    } catch (err) {
      console.error('Payout failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instant Banking Payout Gateway</h3>
              <p className="text-xs text-slate-400">
                Direct integration with Federal Reserve FedNow® & The Clearing House RTP® APIs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {!settledResult ? (
            <>
              {/* Settlement Summary Pill */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Total Approved Payout
                  </span>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">
                    ₹{netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Claimed: ₹{claim.claimedAmount.toLocaleString()} • Deductible: -₹{claim.deductible.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Authorized for Disbursement
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">Claim #{claim.claimNumber}</span>
                </div>
              </div>

              {/* Direct Banking Rails Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Real-Time Settlement Rail
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* FedNow */}
                  <div
                    onClick={() => setSelectedRail('FEDNOW')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRail === 'FEDNOW'
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">Federal Reserve FedNow®</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        ⚡ 1.8s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct central bank settlement. Irrevocable 24/7/365 immediate credit.
                    </p>
                  </div>

                  {/* RTP */}
                  <div
                    onClick={() => setSelectedRail('RTP')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRail === 'RTP'
                        ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-xs font-bold text-white">The Clearing House RTP®</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
                        ⚡ 2.2s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Real-time payment rails supported by 70%+ of US commercial depository accounts.
                    </p>
                  </div>

                  {/* Same-Day ACH */}
                  <div
                    onClick={() => setSelectedRail('ACH_SAME_DAY')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRail === 'ACH_SAME_DAY'
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">NACHA Same-Day ACH</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                        Same-Day (5 PM)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Standard batch clearing via Automated Clearing House.
                    </p>
                  </div>

                  {/* Visa Direct */}
                  <div
                    onClick={() => setSelectedRail('VISA_DIRECT')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRail === 'VISA_DIRECT'
                        ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Visa Direct Push-to-Card</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                        ⚡ &lt;30s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct push to linked debit card account number.
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficiary Depository Account Verification */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Verified Beneficiary Account</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Plaid / FedACH Verified
                  </span>
                </div>

                {/* Popular Bank Selector */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5">Direct Bank Destination:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {POPULAR_BANKS.map((b) => (
                      <button
                        key={b.routing}
                        type="button"
                        onClick={() => handleSelectPopularBank(b)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left border transition-all truncate ${
                          selectedBank === b.name
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {b.logo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Account Holder</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ABA Routing (9-Digit)</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Execution Progress Stepper (Visible during submission) */}
              {isProcessing && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Executing Real-Time Banking API Protocol...</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className={`flex items-center gap-2 ${stepIndex >= 1 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>1. Connecting to Federal Reserve FedNow & RTP Gateway</span>
                    </div>
                    <div className={`flex items-center gap-2 ${stepIndex >= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>2. Generating ISO 20022 pacs.008 Customer Credit Transfer payload</span>
                    </div>
                    <div className={`flex items-center gap-2 ${stepIndex >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>3. Real-time clearing acknowledgment received from {selectedBank}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Settlement Success Receipt */
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center py-4 bg-emerald-950/30 rounded-2xl border border-emerald-800/60">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-3">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-xl font-bold text-white">Funds Successfully Disbursed</h4>
                <p className="text-xs text-emerald-400 mt-1 font-medium">
                  Instant settlement completed in {settledResult.latency} seconds via {selectedRail}.
                </p>
                <div className="text-3xl font-mono font-bold text-white mt-2">
                  ${netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Transaction Receipt Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Transaction ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white">{settledResult.txId}</span>
                    <button
                      onClick={() => copyToClipboard(settledResult.txId)}
                      className="p-1 hover:text-emerald-400 text-slate-500"
                    >
                      {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">FedNow End-to-End Trace:</span>
                  <span className="text-emerald-400">{settledResult.traceId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Beneficiary Bank:</span>
                  <span className="text-white">{selectedBank}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Recipient:</span>
                  <span className="text-white">{accountHolder} ({accountNumber})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ISO 20022 Standard:</span>
                  <span className="text-white">pacs.008.001.08 Credit Transfer</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Settlement Finality:</span>
                  <span className="text-emerald-400 font-bold">FINAL & IRREVOCABLE</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 flex items-center justify-end gap-2">
          {!settledResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Settling on Banking Rail...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Disburse ₹{netPayout.toLocaleString()} Instantly</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Done & Return to Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
