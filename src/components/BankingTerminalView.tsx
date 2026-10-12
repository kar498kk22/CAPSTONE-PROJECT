import React, { useState } from 'react';
import { Claim } from '../types';
import { Building2, Zap, Server, Activity, ArrowRight, ShieldCheck, Check, RefreshCw, Terminal, Globe, Cpu } from 'lucide-react';

interface BankingTerminalViewProps {
  claims: Claim[];
  onTriggerPayout: (claim: Claim) => void;
}

export const BankingTerminalView: React.FC<BankingTerminalViewProps> = ({
  claims,
  onTriggerPayout,
}) => {
  const [selectedRail, setSelectedRail] = useState<'FEDNOW' | 'RTP' | 'ACH'>('FEDNOW');
  const [activeTab, setActiveTab] = useState<'network' | 'payload' | 'webhooks'>('network');
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);
  const [pingLatency, setPingLatency] = useState('18ms');

  const settledClaims = claims.filter((c) => c.status === 'PAYOUT_SETTLED');
  const sampleClaim = settledClaims[0] || claims[0];

  const handleSimulatePing = () => {
    setIsSimulatingPing(true);
    setTimeout(() => {
      setPingLatency(`${Math.floor(14 + Math.random() * 8)}ms`);
      setIsSimulatingPing(false);
    }, 600);
  };

  // Sample ISO 20022 message payload
  const sampleISO20022 = `{
  "Document": {
    "FIToFICstmrCdtTrf": {
      "GrpHdr": {
        "MsgId": "FEDNOW-ISO20022-20261009-88192",
        "CreDtTm": "2026-10-09T09:42:15.000Z",
        "NbOfTxs": "1",
        "SttlmInf": {
          "SttlmMtd": "CLRG",
          "ClrSys": { "Prtry": "FEDNOW_REALTIME_SERVICE" }
        }
      },
      "CdtTrfTxInf": {
        "PmtId": {
          "EndToEndId": "${sampleClaim?.payoutTransaction?.fedNowTraceId || 'FEDNOW:E2E:992014810928'}",
          "TxId": "${sampleClaim?.payoutTransaction?.transactionId || 'TX-FEDNOW-CLR-88102'}"
        },
        "IntrBkSttlmAmt": {
          "@Ccy": "INR",
          "#text": "${(sampleClaim?.payoutTransaction?.amount || sampleClaim?.netPayout || 3350).toFixed(2)}"
        },
        "Dbtr": { "Nm": "ClaimFlow Underwriting & Disbursement LLC" },
        "Cdtr": { "Nm": "${sampleClaim?.claimant.name || 'Sarah Jenkins'}" },
        "CdtrAgt": {
          "FinInstnId": {
            "ClrSysMmbId": {
              "ClrSysId": { "Cd": "INABA" },
              "MmbId": "${sampleClaim?.bankDetails?.routingNumber || '021000021'}"
            },
            "Nm": "${sampleClaim?.bankDetails?.bankName || 'JPMorgan Chase Bank, N.A.'}"
          }
        },
        "RmtInf": {
          "Ustrd": "Insurance Claim Payout Final Settlement #${sampleClaim?.claimNumber || 'CLM-2026-9281'}"
        }
      }
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Top Banking Rails Health Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FedNow */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-bl-xl border-b border-l border-emerald-500/30">
            ONLINE • 99.99% UPTIME
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Federal Reserve FedNow® Service</h4>
          </div>
          <p className="text-xs text-slate-400">
            Instant depository interbank gross settlement. Irrevocable finality within seconds.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Avg Settlement Speed:</span>
            <span className="text-emerald-400 font-bold">1.8 Seconds</span>
          </div>
        </div>

        {/* The Clearing House RTP */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-blue-500/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-bl-xl border-b border-l border-blue-500/30">
            ONLINE • RTP LIVE
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white">The Clearing House (RTP®)</h4>
          </div>
          <p className="text-xs text-slate-400">
            24/7/365 US real-time payment network covering &gt;75% of demand deposit accounts.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Avg Settlement Speed:</span>
            <span className="text-blue-400 font-bold">2.2 Seconds</span>
          </div>
        </div>

        {/* NACHA ACH Same-Day */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-mono font-bold rounded-bl-xl border-b border-l border-slate-700">
            BATCH RAILS
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">NACHA Same-Day ACH</h4>
          </div>
          <p className="text-xs text-slate-400">
            Standard Automated Clearing House windows (10:30 AM, 2:45 PM, 4:45 PM EST).
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Next Batch Window:</span>
            <span className="text-slate-200">1:00 PM EST</span>
          </div>
        </div>
      </div>

      {/* Interactive Banking Console */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Terminal Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Banking API Gateway Operations Console</h3>
              <p className="text-xs text-slate-400">Real-time ISO 20022 message orchestrator & inbound webhook listeners</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulatePing}
              disabled={isSimulatingPing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {isSimulatingPing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>FedNow Node Latency: {pingLatency}</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('network')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'network' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            Live Settlement Stream ({settledClaims.length} Disbursed)
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'payload' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            ISO 20022 pacs.008 Payload Inspector
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'webhooks' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            Banking Webhook Dispatcher
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recent Real-Time Payout Dispatches:</span>
                <span className="font-mono text-emerald-400">Total Volume: ₹{settledClaims.reduce((acc, c) => acc + (c.payoutTransaction?.amount || c.netPayout), 0).toLocaleString()}</span>
              </div>

              {settledClaims.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No instant payouts dispatched yet. Go to Adjuster Desk or Claimant Portal to trigger an instant payout!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {settledClaims.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          ⚡
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{c.payoutTransaction?.transactionId || 'TX-FEDNOW-01'}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              {c.payoutTransaction?.rail || 'FEDNOW'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Claim #{c.claimNumber} • {c.bankDetails?.bankName} ({c.bankDetails?.accountNumberMasked})
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          +${(c.payoutTransaction?.amount || c.netPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Settled in {c.payoutTransaction?.latencySeconds || 1.8}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Generated XML/JSON Schema for Real-Time Clearing:</span>
                <span className="font-mono text-emerald-400 text-[11px]">ISO 20022 pacs.008.001.08 Validated</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
                {sampleISO20022}
              </pre>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block">
                Simulated Federal Reserve Bank & Clearing House Webhook Event Log:
              </span>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">[EVENT: clearing.settled]</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Federal Reserve Bank credit transfer finalized. Funds available immediately.</p>
                  </div>
                  <span className="text-[10px] text-slate-500">200 OK</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-bold">[EVENT: rtp.ack]</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">The Clearing House confirmation receipt #CH-RTP-ACK-88192019 logged.</p>
                  </div>
                  <span className="text-[10px] text-slate-500">200 OK</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-indigo-400 font-bold">[EVENT: plaid.auth.verified]</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Micro-deposit bypass: Instant depository balance and account ownership verified.</p>
                  </div>
                  <span className="text-[10px] text-slate-500">200 OK</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
