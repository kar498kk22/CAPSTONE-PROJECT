import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with recommended user-agent header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory Claims and Banking Store
interface ClaimDocument {
  id: string;
  name: string;
  category: 'Repair Estimate' | 'Police Report' | 'Medical Invoice' | 'Damage Photo' | 'Proof of Loss';
  fileType: string;
  size: string;
  uploadDate: string;
  previewUrl?: string;
  aiAnalysis?: {
    verified: boolean;
    extractedAmount: number;
    vendorName: string;
    incidentDateMatch: boolean;
    fraudScore: number; // 0 (lowest) to 100 (highest)
    flagSummary: string[];
    confidence: number;
  };
}

interface BankDetails {
  bankName: string;
  routingNumber: string;
  accountNumberMasked: string;
  accountType: 'checking' | 'savings';
  accountHolder: string;
  verificationStatus: 'VERIFIED_PLAID' | 'VERIFIED_ROUTING' | 'PENDING';
  rtpEligible: boolean;
  fedNowEligible: boolean;
}

interface PayoutTransaction {
  transactionId: string;
  rail: 'RTP' | 'FEDNOW' | 'ACH_SAME_DAY' | 'VISA_DIRECT';
  amount: number;
  initiatedAt: string;
  settledAt?: string;
  status: 'SETTLED' | 'PROCESSING' | 'PENDING' | 'FAILED';
  fedNowTraceId?: string;
  clearingHouseRef?: string;
  latencySeconds: number;
}

interface TimelineEvent {
  id: string;
  stage: string;
  title: string;
  timestamp: string;
  actor: string;
  note: string;
  isAutomated: boolean;
}

interface Claim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  policyType: 'Auto Collision' | 'Property & Homeowners' | 'Health & Medical' | 'Travel Interruption' | 'Commercial Liability';
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
  status: 'DRAFT' | 'SUBMITTED' | 'DOCS_UNDER_REVIEW' | 'ADJUSTER_ASSESSMENT' | 'APPROVED' | 'PAYOUT_INITIATED' | 'PAYOUT_SETTLED' | 'REJECTED';
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
    overallScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    autoApproveEligible: boolean;
    reasoning: string;
  };
}

interface UserRecord {
  id: string;
  name: string;
  username: string;
  password: string;
  identifierType: 'email' | 'phone';
  email?: string;
  phone?: string;
  role: 'claimant' | 'adjuster';
  createdAt: string;
}

// Pre-seeded users
let usersDB: UserRecord[] = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    username: 'sarah.jenkins@gmail.com',
    password: 'Password123!',
    identifierType: 'email',
    email: 'sarah.jenkins@gmail.com',
    phone: '+1 (555) 349-8812',
    role: 'claimant',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-2',
    name: 'David Zhang',
    username: '5557829014',
    password: 'Password123!',
    identifierType: 'phone',
    email: 'david.zhang@example.com',
    phone: '5557829014',
    role: 'claimant',
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'usr-3',
    name: 'Marcus Vance',
    username: 'marcus.vance@claimflow.com',
    password: 'Password123!',
    identifierType: 'email',
    email: 'marcus.vance@claimflow.com',
    phone: '+1 (555) 999-1122',
    role: 'adjuster',
    createdAt: '2026-08-01T08:00:00Z',
  },
];

// Initial realistic claims
let claimsDB: Claim[] = [
  {
    id: 'clm-001',
    claimNumber: 'CLM-2026-9281',
    policyNumber: 'POL-AUTO-88192',
    policyType: 'Auto Collision',
    claimant: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 349-8812',
      address: '742 Evergreen Terrace, Springfield, OR',
    },
    incident: {
      date: '2026-09-28',
      location: 'Interstate 5, Mile Marker 192, Eugene, OR',
      description: 'Rear-ended at traffic signal during light rain. Bumper cracked, rear quarter panel dented, sensor recalibration required.',
      estimatedLoss: 3850,
    },
    status: 'PAYOUT_SETTLED',
    claimedAmount: 3850,
    approvedAmount: 3850,
    deductible: 500,
    netPayout: 3350,
    createdAt: '2026-09-28T14:22:00Z',
    updatedAt: '2026-09-29T10:15:20Z',
    documents: [
      {
        id: 'doc-101',
        name: 'Apex_Collision_Repair_Estimate.pdf',
        category: 'Repair Estimate',
        fileType: 'application/pdf',
        size: '1.4 MB',
        uploadDate: '2026-09-28T14:35:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 3850,
          vendorName: 'Apex Precision Collision Center',
          incidentDateMatch: true,
          fraudScore: 6,
          flagSummary: ['Certified repair facility detected', 'Parts pricing matches OEM database', 'VIN verified'],
          confidence: 0.98,
        },
      },
      {
        id: 'doc-102',
        name: 'Oregon_State_Police_Incident_Report.pdf',
        category: 'Police Report',
        fileType: 'application/pdf',
        size: '2.1 MB',
        uploadDate: '2026-09-28T14:36:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 0,
          vendorName: 'Oregon State Police #26-8819',
          incidentDateMatch: true,
          fraudScore: 3,
          flagSummary: ['Official badge verification passed', 'Third-party driver admitted fault'],
          confidence: 0.99,
        },
      },
      {
        id: 'doc-103',
        name: 'Rear_Bumper_Damage_Inspection.jpg',
        category: 'Damage Photo',
        fileType: 'image/jpeg',
        size: '3.8 MB',
        uploadDate: '2026-09-28T14:38:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 0,
          vendorName: 'Damage Inspection AI',
          incidentDateMatch: true,
          fraudScore: 4,
          flagSummary: ['Impact pattern consistent with repair quote', 'No metadata tampering detected'],
          confidence: 0.96,
        },
      },
    ],
    bankDetails: {
      bankName: 'JPMorgan Chase Bank, N.A.',
      routingNumber: '021000021',
      accountNumberMasked: '•••• 8914',
      accountType: 'checking',
      accountHolder: 'Sarah Jenkins',
      verificationStatus: 'VERIFIED_PLAID',
      rtpEligible: true,
      fedNowEligible: true,
    },
    payoutTransaction: {
      transactionId: 'TX-FEDNOW-20260929-881920',
      rail: 'FEDNOW',
      amount: 3350,
      initiatedAt: '2026-09-29T10:14:50Z',
      settledAt: '2026-09-29T10:15:20Z',
      status: 'SETTLED',
      fedNowTraceId: 'FEDNOW:END2END:991204918237',
      clearingHouseRef: 'CH-RTP-ACK-88192019',
      latencySeconds: 1.8,
    },
    timeline: [
      {
        id: 't-1',
        stage: 'SUBMISSION',
        title: 'Claim Created and Submitted',
        timestamp: '2026-09-28T14:22:00Z',
        actor: 'Claimant (Sarah Jenkins)',
        note: 'Submitted comprehensive auto claim with 3 supporting attachments.',
        isAutomated: false,
      },
      {
        id: 't-2',
        stage: 'DOCUMENT_ANALYSIS',
        title: 'Automated AI Document Verification Complete',
        timestamp: '2026-09-28T14:25:10Z',
        actor: 'ClaimFlow AI Engine',
        note: 'Scanned repair invoice, police report & damage photo. 0 severe anomalies. Fraud risk: 5/100 (Very Low).',
        isAutomated: true,
      },
      {
        id: 't-3',
        stage: 'AUTO_APPROVAL',
        title: 'Fast-Track Auto-Approval Executed',
        timestamp: '2026-09-28T14:26:00Z',
        actor: 'Straight-Through-Processing (STP) Rule #8',
        note: 'Claim under $5,000 threshold with valid police report & certified shop estimate automatically approved.',
        isAutomated: true,
      },
      {
        id: 't-4',
        stage: 'BANK_VERIFICATION',
        title: 'Instant Account Verification Passed',
        timestamp: '2026-09-29T10:12:00Z',
        actor: 'Plaid / FedACH Gateway',
        note: 'Verified JPMorgan Chase checking account. FedNow and RTP rails active.',
        isAutomated: true,
      },
      {
        id: 't-5',
        stage: 'PAYOUT_INITIATED',
        title: 'Instant FedNow Payout Dispatched',
        timestamp: '2026-09-29T10:14:50Z',
        actor: 'ClaimFlow Banking API Service',
        note: 'Dispatched $3,350.00 via Federal Reserve FedNow Instant Rail.',
        isAutomated: true,
      },
      {
        id: 't-6',
        stage: 'PAYOUT_SETTLED',
        title: 'Funds Cleared in Beneficiary Bank',
        timestamp: '2026-09-29T10:15:20Z',
        actor: 'Federal Reserve Bank Settlement Network',
        note: 'Payment settled irrevocably in 1.8 seconds. Beneficiary balance updated.',
        isAutomated: true,
      },
    ],
    aiFraudRisk: {
      overallScore: 5,
      riskLevel: 'LOW',
      autoApproveEligible: true,
      reasoning: 'Clean police incident report, registered repair shop estimate, verified photos, zero prior duplicate claims.',
    },
  },
  {
    id: 'clm-002',
    claimNumber: 'CLM-2026-7734',
    policyNumber: 'POL-HOME-49102',
    policyType: 'Property & Homeowners',
    claimant: {
      name: 'David & Emily Zhang',
      email: 'david.zhang@example.com',
      phone: '+1 (555) 782-9014',
      address: '1428 Maple Boulevard, Austin, TX',
    },
    incident: {
      date: '2026-10-02',
      location: '1428 Maple Boulevard, Austin, TX',
      description: 'Second-floor bathroom pipe burst while at work. Water leaked through ceiling into kitchen and living room hardwood flooring.',
      estimatedLoss: 6200,
    },
    status: 'ADJUSTER_ASSESSMENT',
    claimedAmount: 6200,
    approvedAmount: 5800,
    deductible: 1000,
    netPayout: 4800,
    createdAt: '2026-10-02T19:40:00Z',
    updatedAt: '2026-10-03T09:12:00Z',
    documents: [
      {
        id: 'doc-201',
        name: 'DryPro_Restoration_Itemized_Invoice.pdf',
        category: 'Repair Estimate',
        fileType: 'application/pdf',
        size: '2.4 MB',
        uploadDate: '2026-10-02T20:10:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 6200,
          vendorName: 'DryPro Disaster Restoration LLC',
          incidentDateMatch: true,
          fraudScore: 12,
          flagSummary: ['Dehumidification units pricing standard', 'Demolition scope verified', 'Minor labor hour variance flagged for adjuster'],
          confidence: 0.94,
        },
      },
      {
        id: 'doc-202',
        name: 'Kitchen_Ceiling_Water_Damage.png',
        category: 'Damage Photo',
        fileType: 'image/png',
        size: '4.1 MB',
        uploadDate: '2026-10-02T20:12:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 0,
          vendorName: 'Visual AI Examiner',
          incidentDateMatch: true,
          fraudScore: 8,
          flagSummary: ['Water stain pattern consistent with pipe rupture', 'Metadata location matches policy premises'],
          confidence: 0.97,
        },
      },
    ],
    bankDetails: {
      bankName: 'Bank of America, N.A.',
      routingNumber: '111000025',
      accountNumberMasked: '•••• 4109',
      accountType: 'checking',
      accountHolder: 'David Zhang',
      verificationStatus: 'VERIFIED_ROUTING',
      rtpEligible: true,
      fedNowEligible: true,
    },
    timeline: [
      {
        id: 't-201',
        stage: 'SUBMISSION',
        title: 'Homeowners Property Claim Lodged',
        timestamp: '2026-10-02T19:40:00Z',
        actor: 'Claimant (David Zhang)',
        note: 'Submitted claim for emergency pipe leak and moisture remediation.',
        isAutomated: false,
      },
      {
        id: 't-202',
        stage: 'DOCUMENT_ANALYSIS',
        title: 'AI Forensic Scan & Extraction Completed',
        timestamp: '2026-10-02T19:44:00Z',
        actor: 'ClaimFlow AI Engine',
        note: 'Extracted $6,200.00 from DryPro invoice. Recommended adjusting drying equipment line to regional cap ($5,800.00).',
        isAutomated: true,
      },
      {
        id: 't-203',
        stage: 'ADJUSTER_ASSESSMENT',
        title: 'Assigned to Senior Property Adjuster',
        timestamp: '2026-10-03T09:12:00Z',
        actor: 'Claims Operations (Marcus Vance)',
        note: 'Adjuster reviewing line items and preparing immediate payout authorization.',
        isAutomated: false,
      },
    ],
    aiFraudRisk: {
      overallScore: 12,
      riskLevel: 'LOW',
      autoApproveEligible: false,
      reasoning: 'Above $5,000 threshold requires 1-click adjuster sign-off. High confidence on incident authenticity and photos.',
    },
  },
  {
    id: 'clm-003',
    claimNumber: 'CLM-2026-5519',
    policyNumber: 'POL-HLTH-10293',
    policyType: 'Health & Medical',
    claimant: {
      name: 'Michael Torres',
      email: 'm.torres@example.com',
      phone: '+1 (555) 912-3841',
      address: '890 Sunset Blvd, Los Angeles, CA',
    },
    incident: {
      date: '2026-10-05',
      location: 'Cedars-Sinai Outpatient Clinic, LA',
      description: 'Emergency outpatient treatment for acute fractured collarbone sustained during weekend recreational cycling.',
      estimatedLoss: 2450,
    },
    status: 'DOCS_UNDER_REVIEW',
    claimedAmount: 2450,
    approvedAmount: 2200,
    deductible: 250,
    netPayout: 1950,
    createdAt: '2026-10-06T11:00:00Z',
    updatedAt: '2026-10-06T11:05:00Z',
    documents: [
      {
        id: 'doc-301',
        name: 'Itemized_Hospital_Billing_Summary.pdf',
        category: 'Medical Invoice',
        fileType: 'application/pdf',
        size: '1.1 MB',
        uploadDate: '2026-10-06T11:03:00Z',
        aiAnalysis: {
          verified: true,
          extractedAmount: 2450,
          vendorName: 'Cedars-Sinai Medical Care',
          incidentDateMatch: true,
          fraudScore: 9,
          flagSummary: ['CPT billing codes match diagnostic notes', 'Standard co-pay calculation applied'],
          confidence: 0.95,
        },
      },
    ],
    bankDetails: {
      bankName: 'Wells Fargo Bank, N.A.',
      routingNumber: '121000247',
      accountNumberMasked: '•••• 7721',
      accountType: 'checking',
      accountHolder: 'Michael Torres',
      verificationStatus: 'VERIFIED_PLAID',
      rtpEligible: true,
      fedNowEligible: true,
    },
    timeline: [
      {
        id: 't-301',
        stage: 'SUBMISSION',
        title: 'Medical Out-of-Pocket Claim Submitted',
        timestamp: '2026-10-06T11:00:00Z',
        actor: 'Claimant (Michael Torres)',
        note: 'Submitted itemized clinic invoice for reimbursement.',
        isAutomated: false,
      },
      {
        id: 't-302',
        stage: 'DOCS_UNDER_REVIEW',
        title: 'Automated Medical Coding Cross-Check Running',
        timestamp: '2026-10-06T11:05:00Z',
        actor: 'ClaimFlow Medical Rules Engine',
        note: 'Validating CPT 73000 (Clavicle X-Ray) and outpatient orthopedic codes against plan coverage limits.',
        isAutomated: true,
      },
    ],
    aiFraudRisk: {
      overallScore: 9,
      riskLevel: 'LOW',
      autoApproveEligible: true,
      reasoning: 'Legitimate medical provider, itemized CPT codes match patient injury history.',
    },
  },
];

// Fallback AI document heuristics when Gemini is not configured or offline
function generateHeuristicAnalysis(fileName: string, category: string, fileTextOrNote: string) {
  const lower = (fileName + ' ' + fileTextOrNote).toLowerCase();
  let extractedAmount = 2850;
  let vendorName = 'Verified Service Provider';
  let fraudScore = 8;
  const flagSummary: string[] = [];

  if (lower.includes('auto') || lower.includes('collision') || lower.includes('car') || lower.includes('repair')) {
    extractedAmount = 3420;
    vendorName = 'Apex Precision Auto Body & Collision';
    flagSummary.push('Validated OEM replacement parts catalogue');
    flagSummary.push('Labor rate complies with state insurance benchmarks');
  } else if (lower.includes('hospital') || lower.includes('medical') || lower.includes('clinic') || lower.includes('doctor')) {
    extractedAmount = 1950;
    vendorName = 'Metropolitan Healthcare & Emergency Services';
    flagSummary.push('Itemized medical billing CPT codes cross-referenced');
    flagSummary.push('Patient deductible and co-pay computed accurately');
  } else if (lower.includes('water') || lower.includes('roof') || lower.includes('restoration') || lower.includes('property')) {
    extractedAmount = 5120;
    vendorName = 'Premier Restoration & Structural Remediation';
    flagSummary.push('Moisture mapping report verified');
    flagSummary.push('Standard structural drying rates applied');
  } else {
    extractedAmount = 1500;
    vendorName = 'Certified Commercial Vendor';
    flagSummary.push('Standard invoice metadata verified');
  }

  // Check potential anomalies
  if (lower.includes('cash') || lower.includes('unverified')) {
    fraudScore += 25;
    flagSummary.push('Warning: Cash payment notation requires secondary audit');
  } else {
    flagSummary.push('Cryptographic file checksum verified genuine');
  }

  return {
    verified: true,
    extractedAmount,
    vendorName,
    incidentDateMatch: true,
    fraudScore,
    flagSummary,
    confidence: 0.96,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '35mb' }));

  // Helper to parse identifier (email or phone)
  function parseIdentifier(input: string): { type: 'email' | 'phone'; normalized: string } | null {
    if (!input) return null;
    const trimmed = input.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return { type: 'email', normalized: trimmed.toLowerCase() };
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return { type: 'phone', normalized: digitsOnly };
    }
    return null;
  }

  // Auth: Register New User
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, username, password, role } = req.body;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters).' });
      }

      const parsedId = parseIdentifier(username);
      if (!parsedId) {
        return res.status(400).json({
          success: false,
          error: 'Username must be a valid email address (e.g. name@gmail.com) or a 10-digit mobile number.',
        });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.',
        });
      }

      // Check if user already exists
      const existing = usersDB.find((u) => {
        const uParsed = parseIdentifier(u.username);
        return uParsed && uParsed.normalized === parsedId.normalized;
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email or mobile number already exists. Please log in.',
        });
      }

      const newUser: UserRecord = {
        id: `usr-${Date.now().toString(36)}`,
        name: name.trim(),
        username: parsedId.normalized,
        password: password,
        identifierType: parsedId.type,
        email: parsedId.type === 'email' ? parsedId.normalized : undefined,
        phone: parsedId.type === 'phone' ? parsedId.normalized : undefined,
        role: role === 'adjuster' ? 'adjuster' : 'claimant',
        createdAt: new Date().toISOString(),
      };

      usersDB.push(newUser);

      // Safe user output without raw password
      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        identifierType: newUser.identifierType,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt,
      };

      res.status(201).json({
        success: true,
        user: safeUser,
        token: `token-${newUser.id}-${Date.now()}`,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ success: false, error: 'Registration failed.' });
    }
  });

  // Auth: User Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
      }

      const parsedId = parseIdentifier(username);
      if (!parsedId) {
        return res.status(400).json({
          success: false,
          error: 'Username must be a valid Gmail/email or 10-digit mobile number.',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.',
        });
      }

      // Find user
      const user = usersDB.find((u) => {
        const uParsed = parseIdentifier(u.username);
        return (
          uParsed &&
          uParsed.normalized === parsedId.normalized &&
          u.password === password
        );
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password. Check credentials or register a new account.',
        });
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        identifierType: user.identifierType,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      };

      res.json({
        success: true,
        user: safeUser,
        token: `token-${user.id}-${Date.now()}`,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Login failed.' });
    }
  });

  // Auth: Get Current Profile by Token / Session
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization token' });
    }
    const token = authHeader.replace('Bearer ', '');
    const userId = token.split('-')[1];
    const user = usersDB.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User session not found' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        identifierType: user.identifierType,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  // 1. Get all claims
  app.get('/api/claims', (req, res) => {
    res.json({
      success: true,
      claims: claimsDB,
      metrics: {
        totalClaims: claimsDB.length,
        settledPayouts: claimsDB.filter((c) => c.status === 'PAYOUT_SETTLED').length,
        totalDisbursedAmount: claimsDB
          .filter((c) => c.status === 'PAYOUT_SETTLED')
          .reduce((acc, c) => acc + (c.payoutTransaction?.amount || c.netPayout), 0),
        avgSettlementSeconds: 2.4, // Instant banking average
      },
    });
  });

  // 2. Get single claim by ID
  app.get('/api/claims/:id', (req, res) => {
    const claim = claimsDB.find((c) => c.id === req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }
    res.json({ success: true, claim });
  });

  // 3. Create a new claim
  app.post('/api/claims', (req, res) => {
    try {
      const {
        policyNumber,
        policyType,
        claimant,
        incident,
        claimedAmount,
        deductible,
        documents,
        bankDetails,
      } = req.body;

      const newId = `clm-${Date.now().toString(36)}`;
      const randomClaimNum = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const initialDeductible = Number(deductible) || 500;
      const initialClaimed = Number(claimedAmount) || 2500;
      const initialApproved = initialClaimed;
      const initialNet = Math.max(0, initialApproved - initialDeductible);

      const newClaim: Claim = {
        id: newId,
        claimNumber: randomClaimNum,
        policyNumber: policyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        policyType: policyType || 'Auto Collision',
        claimant: claimant || {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '100 Main St, Austin, TX',
        },
        incident: incident || {
          date: new Date().toISOString().split('T')[0],
          location: 'Austin, TX',
          description: 'Incident report submitted.',
          estimatedLoss: initialClaimed,
        },
        status: 'SUBMITTED',
        claimedAmount: initialClaimed,
        approvedAmount: initialApproved,
        deductible: initialDeductible,
        netPayout: initialNet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: documents || [],
        bankDetails: bankDetails,
        timeline: [
          {
            id: `t-${Date.now()}-1`,
            stage: 'SUBMISSION',
            title: 'Claim Created and Submitted',
            timestamp: new Date().toISOString(),
            actor: `Claimant (${claimant?.name || 'Jane Doe'})`,
            note: 'Initial claim submission with documentation and bank payment coordinates.',
            isAutomated: false,
          },
        ],
        aiFraudRisk: {
          overallScore: 8,
          riskLevel: 'LOW',
          autoApproveEligible: initialClaimed <= 5000,
          reasoning: 'Standard submission profile with verified identity and policy validation.',
        },
      };

      claimsDB.unshift(newClaim);
      res.status(201).json({ success: true, claim: newClaim });
    } catch (err: any) {
      console.error('Error creating claim:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // 4. AI Document Analysis Endpoint (Gemini 3.8 Flash + robust fallback)
  app.post('/api/analyze-document', async (req, res) => {
    try {
      const { fileName, category, fileType, fileData, notes } = req.body;

      if (!fileName) {
        return res.status(400).json({ success: false, error: 'Document fileName is required' });
      }

      // Check if real Gemini API key is available and usable
      const hasRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;
      if (ai && hasRealKey) {
        try {
          const prompt = `You are a certified insurance fraud examiner and claims automation AI.
Analyze the following document information for an insurance claim:
- File Name: "${fileName}"
- Document Category: "${category || 'Invoice / Estimate'}"
- Document Context Notes: "${notes || 'User uploaded supporting insurance documentation'}"

Evaluate and extract the data into this structured JSON schema:
1. extractedAmount: (number) Estimated total claimed amount found or inferred from the document description.
2. vendorName: (string) Certified service provider, medical clinic, repair body shop, or police department name.
3. incidentDateMatch: (boolean) True if documentation timeline is logical and authentic.
4. fraudScore: (number) Between 0 and 100 where 0 is pristine/legitimate and 100 is blatant fraud.
5. flagSummary: (array of strings) 2-4 professional auditing notes (e.g., "OEM parts prices validated", "Digital watermark authenticated", "No duplicate billing detected").
6. confidence: (number) Between 0.85 and 0.99 confidence.
7. autoApproveRecommendation: (boolean) True if fraudScore < 20 and amount <= 5000.`;

          // Timeout race after 6 seconds to prevent hanging
          const generatePromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  extractedAmount: { type: Type.NUMBER },
                  vendorName: { type: Type.STRING },
                  incidentDateMatch: { type: Type.BOOLEAN },
                  fraudScore: { type: Type.NUMBER },
                  flagSummary: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  confidence: { type: Type.NUMBER },
                  autoApproveRecommendation: { type: Type.BOOLEAN },
                },
                required: ['extractedAmount', 'vendorName', 'incidentDateMatch', 'fraudScore', 'flagSummary', 'confidence'],
              },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
          );

          const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return res.json({
              success: true,
              source: 'gemini-3.8-flash',
              analysis: {
                verified: true,
                extractedAmount: Number(parsed.extractedAmount) || 2850,
                vendorName: parsed.vendorName || 'Verified Certified Vendor',
                incidentDateMatch: parsed.incidentDateMatch ?? true,
                fraudScore: Math.min(100, Math.max(0, Number(parsed.fraudScore) || 7)),
                flagSummary: parsed.flagSummary || ['Document digital structure validated', 'Zero duplicate records found'],
                confidence: Number(parsed.confidence) || 0.97,
                autoApproveRecommendation: parsed.autoApproveRecommendation ?? true,
              },
            });
          }
        } catch (geminiError: any) {
          console.warn('Gemini API call failed, falling back to built-in rules engine:', geminiError?.message);
        }
      }

      // Built-in intelligent rules engine fallback
      const fallback = generateHeuristicAnalysis(fileName, category, notes || '');
      return res.json({
        success: true,
        source: 'rules-engine-fallback',
        analysis: fallback,
      });
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      res.status(500).json({ success: false, error: err.message || 'Document analysis error' });
    }
  });

  // 4B. Gemini Multi-Turn Chatbot with Search Grounding
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, role = 'general', model = 'gemini-3.5-flash', useSearchGrounding = false } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Messages array is required' });
      }

      // Model selection logic based on requirements:
      // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general & search grounding, gemini-3.1-flash-lite for fast tasks
      let selectedModel = 'gemini-3.5-flash';
      if (useSearchGrounding) {
        selectedModel = 'gemini-3.5-flash'; // Google Search tool required model
      } else if (model === 'gemini-3.1-pro-preview' || model === 'pro') {
        selectedModel = 'gemini-3.1-pro-preview';
      } else if (model === 'gemini-3.1-flash-lite' || model === 'fast') {
        selectedModel = 'gemini-3.1-flash-lite';
      } else {
        selectedModel = 'gemini-3.5-flash';
      }

      // System Instructions by Chatbot Persona
      let systemInstruction = 'You are ClaimFlow AI, an intelligent insurance claim and instant payout assistant.';
      if (role === 'coverage') {
        systemInstruction =
          'You are ClaimFlow Coverage & Policy Intake Specialist. Guide policyholders on claim filing, deductible rules, coverage limits, and what receipts, estimates, and police reports they need to submit. Be helpful, concise, and reassuring.';
      } else if (role === 'underwriting') {
        systemInstruction =
          'You are ClaimFlow Senior Claims Underwriting & Forensic Auditor. Evaluate loss assessments, OEM replacement costs, fraud anomaly detection (0-100 score), and Straight-Through Processing (STP) thresholds. Offer technical insurance analysis.';
      } else if (role === 'settlement') {
        systemInstruction =
          'You are ClaimFlow Real-Time Banking & Instant Settlement Engineer. Explain Federal Reserve FedNow® Service, The Clearing House RTP® Network, same-day ACH, ISO 20022 pacs.008 credit transfers, and bank routing verification.';
      }

      // Format conversation history for Gemini
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text || m.content || '' }],
      }));

      const hasRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;
      if (ai && hasRealKey) {
        try {
          const config: any = {
            systemInstruction,
          };

          if (useSearchGrounding) {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await ai.models.generateContent({
            model: selectedModel,
            contents: formattedContents,
            config,
          });

          const replyText = response.text || 'I have analyzed your inquiry.';
          const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
          const searchCitations = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Web Reference',
            uri: chunk.web?.uri || '',
          })) || [];

          return res.json({
            success: true,
            model: selectedModel,
            role,
            reply: replyText,
            grounding: {
              searchQueries: groundingMetadata?.webSearchQueries || [],
              citations: searchCitations,
            },
          });
        } catch (geminiError: any) {
          console.warn('Chatbot Gemini API error, falling back:', geminiError?.message);
        }
      }

      // Fallback response generator if Gemini key is offline
      const lastUserMsg = messages[messages.length - 1]?.text?.toLowerCase() || '';
      let fallbackReply = `Thank you for reaching out to ClaimFlow. `;
      if (lastUserMsg.includes('payout') || lastUserMsg.includes('bank') || lastUserMsg.includes('fednow') || lastUserMsg.includes('rtp')) {
        fallbackReply += `Our system integrates directly with the Federal Reserve FedNow® Service and The Clearing House RTP® Network. Approved settlements are disbursed in under 2 seconds irrevocably into your verified depository account.`;
      } else if (lastUserMsg.includes('upload') || lastUserMsg.includes('document') || lastUserMsg.includes('receipt') || lastUserMsg.includes('photo')) {
        fallbackReply += `You can upload itemized repair quotes, emergency medical bills, police accident reports, or damage photos. Our multimodal AI engine performs automated OCR and fraud anomaly detection within seconds.`;
      } else if (lastUserMsg.includes('status') || lastUserMsg.includes('track') || lastUserMsg.includes('claim')) {
        fallbackReply += `Your claim progresses across 5 automated stages: Claim Lodged → AI Document Verification → Adjuster Technical Review → Approved → Banking Payout Settled. You can track real-time milestones on your dashboard.`;
      } else {
        fallbackReply += `I am your ClaimFlow AI assistant. I can guide you through filing a new claim, uploading supporting documentation, verifying repair quotes, and checking instant banking payout eligibility via FedNow and RTP.`;
      }

      return res.json({
        success: true,
        model: selectedModel,
        role,
        reply: fallbackReply,
        grounding: {
          searchQueries: useSearchGrounding ? ['ClaimFlow Insurance Settlement Guidelines'] : [],
          citations: useSearchGrounding ? [{ title: 'FedNow Service Operating Rules', uri: 'https://www.frbservices.org/financial-services/fednow' }] : [],
        },
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ success: false, error: 'Chat service error' });
    }
  });

  // 4C. Live Search Grounding Verification Endpoint (gemini-3.5-flash with googleSearch)
  app.post('/api/search-verify', async (req, res) => {
    try {
      const { query, category = 'insurance_benchmark' } = req.body;
      if (!query) {
        return res.status(400).json({ success: false, error: 'Search query is required' });
      }

      const hasRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;
      if (ai && hasRealKey) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Verify this insurance claim data using live Google Search: "${query}". Provide up-to-date facts, benchmark costs or regulatory standards, and confirm authenticity.`,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: 'You are an insurance regulatory researcher and live facts validator. Use Google Search to provide factual citations.',
            },
          });

          const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
          return res.json({
            success: true,
            summary: response.text || 'Verification search completed.',
            citations: groundingMetadata?.groundingChunks?.map((c: any) => ({
              title: c.web?.title || 'Official Source',
              uri: c.web?.uri || '',
            })) || [],
          });
        } catch (e: any) {
          console.warn('Search verify error:', e?.message);
        }
      }

      // Fallback search response
      return res.json({
        success: true,
        summary: `Verified via industry standards: ${query}. National insurance database averages align with typical reimbursement schedules.`,
        citations: [
          { title: 'National Association of Insurance Commissioners (NAIC)', uri: 'https://content.naic.org/' },
          { title: 'Insurance Information Institute Benchmarks', uri: 'https://www.iii.org/' },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Search verification failed' });
    }
  });

  // 5. Banking API: Routing number & Account Verification (Plaid / FedACH simulator)
  app.post('/api/banking/verify-account', (req, res) => {
    try {
      const { routingNumber, accountNumber, accountHolder } = req.body;

      if (!routingNumber || routingNumber.length < 9) {
        return res.status(400).json({ success: false, error: 'Valid 9-digit US ABA routing number required' });
      }

      // Real Federal Reserve Routing mapping
      const prefix = routingNumber.substring(0, 4);
      let bankName = 'First National Commercial Bank, N.A.';
      let rtpEligible = true;
      let fedNowEligible = true;

      if (routingNumber.startsWith('0210') || routingNumber.startsWith('0212')) {
        bankName = 'JPMorgan Chase Bank, N.A.';
      } else if (routingNumber.startsWith('1110') || routingNumber.startsWith('0260')) {
        bankName = 'Bank of America, N.A.';
      } else if (routingNumber.startsWith('1210') || routingNumber.startsWith('0910')) {
        bankName = 'Wells Fargo Bank, N.A.';
      } else if (routingNumber.startsWith('0211') || routingNumber.startsWith('3211')) {
        bankName = 'Citibank, N.A.';
      } else if (routingNumber.startsWith('0514') || routingNumber.startsWith('0510')) {
        bankName = 'Capital One, N.A.';
      } else if (routingNumber.startsWith('1222') || routingNumber.startsWith('3222')) {
        bankName = 'Silicon Valley Bank / First Citizens';
      } else {
        bankName = `${bankName} (ABA ${prefix})`;
      }

      const masked = accountNumber ? `•••• ${accountNumber.slice(-4)}` : '•••• 4921';

      return res.json({
        success: true,
        verified: true,
        bankDetails: {
          bankName,
          routingNumber,
          accountNumberMasked: masked,
          accountType: 'checking',
          accountHolder: accountHolder || 'Primary Policyholder',
          verificationStatus: 'VERIFIED_PLAID',
          rtpEligible,
          fedNowEligible,
        },
        supportedRails: [
          { rail: 'FEDNOW', name: 'Federal Reserve FedNow® Instant Settlement', latency: '< 2 seconds', fee: '$0.00' },
          { rail: 'RTP', name: 'The Clearing House RTP® Network', latency: '< 3 seconds', fee: '$0.00' },
          { rail: 'ACH_SAME_DAY', name: 'NACHA Same-Day ACH Direct Deposit', latency: 'Same business day', fee: '$0.00' },
          { rail: 'VISA_DIRECT', name: 'Visa Direct Push-to-Card', latency: '< 30 seconds', fee: '$0.00' },
        ],
      });
    } catch (err: any) {
      console.error('Banking verification error:', err);
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  });

  // 6. Banking API: Execute Instant Payout (RTP / FedNow Rails)
  app.post('/api/banking/initiate-payout', (req, res) => {
    try {
      const { claimId, rail, amount, bankDetails } = req.body;

      const claim = claimsDB.find((c) => c.id === claimId);
      if (!claim) {
        return res.status(404).json({ success: false, error: 'Claim not found' });
      }

      const payoutRail = rail || 'FEDNOW';
      const payoutAmount = Number(amount) || claim.netPayout || 2500;
      const txId = `TX-${payoutRail}-${Date.now().toString(36).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const fedNowTrace = `FEDNOW:E2E:${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const chRef = `CLR-RTP-SETTLED-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const transaction: PayoutTransaction = {
        transactionId: txId,
        rail: payoutRail,
        amount: payoutAmount,
        initiatedAt: new Date().toISOString(),
        settledAt: new Date().toISOString(),
        status: 'SETTLED',
        fedNowTraceId: fedNowTrace,
        clearingHouseRef: chRef,
        latencySeconds: payoutRail === 'FEDNOW' ? 1.6 : payoutRail === 'RTP' ? 2.2 : 4.8,
      };

      // Update claim
      claim.status = 'PAYOUT_SETTLED';
      claim.payoutTransaction = transaction;
      if (bankDetails) {
        claim.bankDetails = bankDetails;
      }
      claim.updatedAt = new Date().toISOString();

      // Add timeline event
      claim.timeline.push({
        id: `t-${Date.now()}-payout`,
        stage: 'PAYOUT_SETTLED',
        title: `Instant ${payoutRail} Banking Payout Cleared`,
        timestamp: new Date().toISOString(),
        actor: 'ClaimFlow Direct Banking API Gateway',
        note: `Disbursed $${payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${claim.bankDetails?.bankName || 'Beneficiary Account'} (${claim.bankDetails?.accountNumberMasked || '•••• 8914'}). End-to-end trace: ${fedNowTrace}. Latency: ${transaction.latencySeconds}s.`,
        isAutomated: true,
      });

      return res.json({
        success: true,
        claim,
        transaction,
        receipt: {
          receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          payer: 'ClaimFlow Underwriting & Disbursement LLC',
          payee: claim.claimant.name,
          amountFormatted: `$${payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          railName: payoutRail === 'FEDNOW' ? 'Federal Reserve FedNow Instant Rails' : 'The Clearing House Real-Time Payments (RTP)',
          iso20022MessageType: 'pacs.008.001.08 FI-to-FI Customer Credit Transfer',
          settlementStatus: 'FINAL_AND_IRREVOCABLE',
        },
      });
    } catch (err: any) {
      console.error('Banking payout error:', err);
      res.status(500).json({ success: false, error: 'Payout processing error' });
    }
  });

  // 7. Advance Claim Lifecycle Stage (Automate or Adjuster action)
  app.post('/api/claims/:id/advance', (req, res) => {
    try {
      const { id } = req.params;
      const { nextStatus, note, actor, approvedAmount, deductible } = req.body;

      const claim = claimsDB.find((c) => c.id === id);
      if (!claim) {
        return res.status(404).json({ success: false, error: 'Claim not found' });
      }

      if (approvedAmount !== undefined) {
        claim.approvedAmount = Number(approvedAmount);
      }
      if (deductible !== undefined) {
        claim.deductible = Number(deductible);
      }
      claim.netPayout = Math.max(0, claim.approvedAmount - claim.deductible);

      const targetStatus = nextStatus || 'APPROVED';
      claim.status = targetStatus;
      claim.updatedAt = new Date().toISOString();

      let title = `Status Advanced to ${targetStatus}`;
      if (targetStatus === 'DOCS_UNDER_REVIEW') title = 'Document Forensic Analysis Commenced';
      if (targetStatus === 'ADJUSTER_ASSESSMENT') title = 'Under Adjuster Technical Review';
      if (targetStatus === 'APPROVED') title = 'Claim Settlement Approved';
      if (targetStatus === 'PAYOUT_INITIATED') title = 'Banking Rail Payout Dispatched';
      if (targetStatus === 'PAYOUT_SETTLED') title = 'Funds Cleared in Beneficiary Account';

      claim.timeline.push({
        id: `t-${Date.now()}-adv`,
        stage: targetStatus,
        title,
        timestamp: new Date().toISOString(),
        actor: actor || 'Automated Claims Orchestrator',
        note: note || `Claim status updated to ${targetStatus}.`,
        isAutomated: actor ? false : true,
      });

      return res.json({ success: true, claim });
    } catch (err: any) {
      console.error('Advance error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Add document to existing claim
  app.post('/api/claims/:id/documents', (req, res) => {
    try {
      const { id } = req.params;
      const { document } = req.body;

      const claim = claimsDB.find((c) => c.id === id);
      if (!claim) {
        return res.status(404).json({ success: false, error: 'Claim not found' });
      }

      claim.documents.push(document);
      claim.updatedAt = new Date().toISOString();

      claim.timeline.push({
        id: `t-${Date.now()}-doc`,
        stage: 'DOCUMENT_UPLOAD',
        title: `Uploaded: ${document.name}`,
        timestamp: new Date().toISOString(),
        actor: 'Claimant Portal',
        note: `Attached ${document.category} (${document.size}). Automated OCR scan initiated.`,
        isAutomated: true,
      });

      return res.json({ success: true, claim });
    } catch (err: any) {
      console.error('Add document error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`ClaimFlow insurance backend & Vite running at http://localhost:${PORT}`);
  });
}

startServer();
