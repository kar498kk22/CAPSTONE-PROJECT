import React, { useState, useEffect } from 'react';
import { Claim, ClaimDocument, PolicyType, User as UserType } from '../types';
import { SAMPLE_DOCUMENTS } from '../utils/sampleData';
import { Shield, FileText, Building2, Upload, Plus, Trash2, ArrowRight, ArrowLeft, Check, Sparkles, X, Loader2 } from 'lucide-react';

interface NewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCreated: (claim: Claim) => void;
  currentUser: UserType | null;
}

export const NewClaimModal: React.FC<NewClaimModalProps> = ({
  isOpen,
  onClose,
  onClaimCreated,
  currentUser,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [policyType, setPolicyType] = useState<PolicyType>('Auto Collision');
  const [policyNumber, setPolicyNumber] = useState('POL-AUTO-94182');
  const [claimantName, setClaimantName] = useState(currentUser?.name || 'Alex Morgan');
  const [claimantEmail, setClaimantEmail] = useState(
    currentUser?.email || (currentUser?.identifierType === 'email' ? currentUser.username : 'alex.morgan@example.com')
  );
  const [claimantPhone, setClaimantPhone] = useState(
    currentUser?.phone || (currentUser?.identifierType === 'phone' ? currentUser.username : '+1 (555) 782-4419')
  );

  useEffect(() => {
    if (currentUser) {
      setClaimantName(currentUser.name);
      if (currentUser.email) setClaimantEmail(currentUser.email);
      else if (currentUser.identifierType === 'email') setClaimantEmail(currentUser.username);
      if (currentUser.phone) setClaimantPhone(currentUser.phone);
      else if (currentUser.identifierType === 'phone') setClaimantPhone(currentUser.username);
    }
  }, [currentUser]);
  const [incidentDate, setIncidentDate] = useState('2026-10-08');
  const [incidentLocation, setIncidentLocation] = useState('Downtown Expressway & 4th Ave');
  const [incidentDescription, setIncidentDescription] = useState('Multi-vehicle collision during morning rush hour. Front grill damaged.');
  const [estimatedLoss, setEstimatedLoss] = useState(3200);
  const [deductible, setDeductible] = useState(500);

  // Attached Documents
  const [attachedDocuments, setAttachedDocuments] = useState<ClaimDocument[]>([]);

  // Banking Coordinates
  const [bankName, setBankName] = useState('JPMorgan Chase Bank, N.A.');
  const [routingNumber, setRoutingNumber] = useState('021000021');
  const [accountNumber, setAccountNumber] = useState('•••• 9184');

  if (!isOpen) return null;

  // Quick attach sample document
  const handleAttachSample = async (preset: (typeof SAMPLE_DOCUMENTS)[0]) => {
    // Generate AI document metadata
    const doc: ClaimDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      category: preset.category,
      fileType: preset.fileType,
      size: preset.size,
      uploadDate: new Date().toISOString(),
      aiAnalysis: {
        verified: true,
        extractedAmount: preset.simulatedContent.total,
        vendorName: preset.simulatedContent.vendor,
        incidentDateMatch: true,
        fraudScore: 6,
        flagSummary: ['OEM itemized part pricing verified', 'Vendor active in regional directory'],
        confidence: 0.98,
        autoApproveRecommendation: true,
      },
    };

    setAttachedDocuments((prev) => [...prev, doc]);
    // Optionally update estimated loss
    if (preset.simulatedContent.total > 0) {
      setEstimatedLoss(preset.simulatedContent.total);
    }
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyNumber,
          policyType,
          claimant: {
            name: claimantName,
            email: claimantEmail,
            phone: claimantPhone,
            address: incidentLocation,
          },
          incident: {
            date: incidentDate,
            location: incidentLocation,
            description: incidentDescription,
            estimatedLoss,
          },
          claimedAmount: estimatedLoss,
          deductible,
          documents: attachedDocuments,
          bankDetails: {
            bankName,
            routingNumber,
            accountNumberMasked: accountNumber,
            accountType: 'checking',
            accountHolder: claimantName,
            verificationStatus: 'VERIFIED_PLAID',
            rtpEligible: true,
            fedNowEligible: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onClaimCreated(data.claim);
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit claim:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">File Insurance Claim</h3>
              <p className="text-xs text-slate-400">Step {step} of 3: {step === 1 ? 'Incident Details' : step === 2 ? 'Upload Supporting Documents' : 'Direct Payout Banking'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between max-w-sm mx-auto text-xs font-semibold">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 py-2 border-b-2 transition-all ${
                step === 1 ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>1</span>
              <span>Details</span>
            </button>

            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 py-2 border-b-2 transition-all ${
                step === 2 ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>2</span>
              <span>Documents ({attachedDocuments.length})</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 py-2 border-b-2 transition-all ${
                step === 3 ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>3</span>
              <span>Banking Payout</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Policy Type</label>
                  <select
                    value={policyType}
                    onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Auto Collision">Auto Collision</option>
                    <option value="Property & Homeowners">Property & Homeowners</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Travel Interruption">Travel Interruption</option>
                    <option value="Commercial Liability">Commercial Liability</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Claimant Name</label>
                  <input
                    type="text"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    value={claimantEmail}
                    onChange={(e) => setClaimantEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone</label>
                  <input
                    type="text"
                    value={claimantPhone}
                    onChange={(e) => setClaimantPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date of Incident</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Location of Occurrence</label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-slate-300 font-semibold block mb-1">Incident Description</label>
                <textarea
                  rows={2}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estimated Loss ($)</label>
                  <input
                    type="number"
                    value={estimatedLoss}
                    onChange={(e) => setEstimatedLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Policy Deductible ($)</label>
                  <input
                    type="number"
                    value={deductible}
                    onChange={(e) => setDeductible(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1">Attach Supporting Documentation</h4>
                <p className="text-[11px] text-slate-400">
                  Select sample documents or your own attachments for automatic OCR extraction.
                </p>
              </div>

              {/* Sample Document Quick Add Cards */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Click to attach realistic verified presets:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_DOCUMENTS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAttachSample(preset)}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-semibold text-white group-hover:text-blue-300 truncate block">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {preset.category} • ₹{preset.simulatedContent.total.toLocaleString()}
                        </span>
                      </div>
                      <span className="shrink-0 p-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attached List */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Attached to this Claim ({attachedDocuments.length})
                </span>
                {attachedDocuments.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    No documents attached yet. Click a preset above to attach.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block">{doc.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {doc.category} • ₹{doc.aiAnalysis?.extractedAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1">Direct Banking Payout Coordinates</h4>
                <p className="text-[11px] text-slate-400">
                  Approved settlements will be deposited via Federal Reserve FedNow or RTP instantly to this account.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Financial Institution</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">ABA Routing (9 Digits)</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    FedNow® & RTP® Instant Eligibility Confirmed
                  </span>
                  <span className="font-mono">Settlement &lt; 2s</span>
                </div>
              </div>

              {/* Settlement Calculation Preview */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Net Payout</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    ₹{Math.max(0, estimatedLoss - deductible).toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  (₹{estimatedLoss.toLocaleString()} - ₹{deductible.toLocaleString()} deductible)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Lodging Claim...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Submit & Track Claim</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
