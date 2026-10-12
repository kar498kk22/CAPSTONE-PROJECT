export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCS_UNDER_REVIEW'
  | 'ADJUSTER_ASSESSMENT'
  | 'APPROVED'
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_SETTLED'
  | 'REJECTED';

export type PolicyType =
  | 'Auto Collision'
  | 'Property & Homeowners'
  | 'Health & Medical'
  | 'Travel Interruption'
  | 'Commercial Liability';

export type DocumentCategory =
  | 'Repair Estimate'
  | 'Police Report'
  | 'Medical Invoice'
  | 'Damage Photo'
  | 'Proof of Loss';

export type PaymentRail = 'RTP' | 'FEDNOW' | 'ACH_SAME_DAY' | 'VISA_DIRECT';

export interface User {
  id: string;
  name: string;
  username: string; // Gmail/email or mobile number
  identifierType: 'email' | 'phone';
  email?: string;
  phone?: string;
  role: 'claimant' | 'adjuster';
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface DocumentAIAnalysis {
  verified: boolean;
  extractedAmount: number;
  vendorName: string;
  incidentDateMatch: boolean;
  fraudScore: number; // 0-100
  flagSummary: string[];
  confidence: number;
  autoApproveRecommendation?: boolean;
}

export interface ClaimDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileType: string;
  size: string;
  uploadDate: string;
  previewUrl?: string;
  aiAnalysis?: DocumentAIAnalysis;
}

export interface BankDetails {
  bankName: string;
  routingNumber: string;
  accountNumberMasked: string;
  accountType: 'checking' | 'savings';
  accountHolder: string;
  verificationStatus: 'VERIFIED_PLAID' | 'VERIFIED_ROUTING' | 'PENDING';
  rtpEligible: boolean;
  fedNowEligible: boolean;
}

export interface PayoutTransaction {
  transactionId: string;
  rail: PaymentRail;
  amount: number;
  initiatedAt: string;
  settledAt?: string;
  status: 'SETTLED' | 'PROCESSING' | 'PENDING' | 'FAILED';
  fedNowTraceId?: string;
  clearingHouseRef?: string;
  latencySeconds: number;
}

export interface TimelineEvent {
  id: string;
  stage: string;
  title: string;
  timestamp: string;
  actor: string;
  note: string;
  isAutomated: boolean;
}

export interface Claim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  policyType: PolicyType;
  claimant: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  incident: {
    date: string;
    location: string;
    description: string;
    estimatedLoss: number;
  };
  status: ClaimStatus;
  claimedAmount: number;
  approvedAmount: number;
  deductible: number;
  netPayout: number;
  createdAt: string;
  updatedAt: string;
  documents: ClaimDocument[];
  bankDetails?: BankDetails;
  payoutTransaction?: PayoutTransaction;
  timeline: TimelineEvent[];
  aiFraudRisk: {
    overallScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    autoApproveEligible: boolean;
    reasoning: string;
  };
}

export interface SettlementReceipt {
  receiptNumber: string;
  payer: string;
  payee: string;
  amountFormatted: string;
  railName: string;
  iso20022MessageType: string;
  settlementStatus: string;
  traceId?: string;
  timestamp: string;
}
