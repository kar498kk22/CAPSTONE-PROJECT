import { ClaimDocument } from '../types';

export interface SampleDocPreset {
  id: string;
  name: string;
  category: ClaimDocument['category'];
  fileType: string;
  size: string;
  summary: string;
  simulatedContent: {
    vendor: string;
    invoiceNo: string;
    date: string;
    lineItems: Array<{ desc: string; amount: number }>;
    total: number;
    notes: string;
  };
}

export const SAMPLE_DOCUMENTS: SampleDocPreset[] = [
  {
    id: 'sample-auto-estimate',
    name: 'Apex_Collision_Repair_Estimate_#9921.pdf',
    category: 'Repair Estimate',
    fileType: 'application/pdf',
    size: '1.8 MB',
    summary: 'Itemized OEM auto bumper & fender structural body repair quote.',
    simulatedContent: {
      vendor: 'Apex Collision & Certified Body Works',
      invoiceNo: 'EST-2026-9921',
      date: '2026-09-28',
      lineItems: [
        { desc: 'Front/Rear Bumper Cover Assembly (OEM Parts)', amount: 1420.0 },
        { desc: 'Paint, Clearcoat & Refinish Labor (8.5 hrs)', amount: 980.0 },
        { desc: 'ADAS Sensor & Radar Recalibration', amount: 650.0 },
        { desc: 'Structural Alignment & Frame Inspection', amount: 370.0 },
      ],
      total: 3420.0,
      notes: 'Certified ASE master technician inspection. Impact damage strictly corresponds with police incident report.',
    },
  },
  {
    id: 'sample-medical-bill',
    name: 'St_Jude_Hospital_Itemized_Emergency_Bill.pdf',
    category: 'Medical Invoice',
    fileType: 'application/pdf',
    size: '2.4 MB',
    summary: 'Hospital emergency department billing with CPT codes.',
    simulatedContent: {
      vendor: 'St. Jude Memorial Health & Emergency Center',
      invoiceNo: 'MED-INV-882194',
      date: '2026-10-04',
      lineItems: [
        { desc: 'Emergency Room Evaluation & Management (Level 4)', amount: 1100.0 },
        { desc: 'Diagnostic Digital X-Ray (3 views) & Orthopedic Splinting', amount: 580.0 },
        { desc: 'Pharmacy & Analgesic Injections', amount: 270.0 },
      ],
      total: 1950.0,
      notes: 'In-network emergency care. Zero duplicate claims across national health claims database.',
    },
  },
  {
    id: 'sample-water-damage',
    name: 'DryPro_Restoration_Moisture_Invoice.pdf',
    category: 'Repair Estimate',
    fileType: 'application/pdf',
    size: '3.1 MB',
    summary: 'Residential water mitigation, dehumidifier runtime & drywall repair.',
    simulatedContent: {
      vendor: 'DryPro Disaster Restoration & Drying Services',
      invoiceNo: 'REST-7712-TX',
      date: '2026-10-02',
      lineItems: [
        { desc: 'Industrial LGR Dehumidifiers (4 units, 72 hours)', amount: 1840.0 },
        { desc: 'Air Scrubbers & Microbial Treatment Barrier', amount: 890.0 },
        { desc: 'Kitchen Ceiling Drywall Extraction & Containment', amount: 1650.0 },
        { desc: 'Certified Moisture Mapping & Post-Dry Thermal Audit', amount: 740.0 },
      ],
      total: 5120.0,
      notes: 'Emergency water extraction following supply line burst. Psychrometric drying logs attached.',
    },
  },
  {
    id: 'sample-police-report',
    name: 'Official_Police_Traffic_Incident_Report.pdf',
    category: 'Police Report',
    fileType: 'application/pdf',
    size: '1.2 MB',
    summary: 'Official traffic collision report filed by highway patrol officer.',
    simulatedContent: {
      vendor: 'State Highway Patrol - Incident Unit',
      invoiceNo: 'POLICE-CASENO-2026-44109',
      date: '2026-09-28',
      lineItems: [
        { desc: 'Accident Investigation Filing Fee', amount: 50.0 },
      ],
      total: 50.0,
      notes: 'Investigating Officer Badge #491. Third-party cited for failure to control speed. Claimant vehicle legally stopped.',
    },
  },
];

export const POPULAR_BANKS = [
  { name: 'JPMorgan Chase Bank, N.A.', routing: '021000021', rtp: true, fednow: true, logo: 'Chase' },
  { name: 'Bank of America, N.A.', routing: '111000025', rtp: true, fednow: true, logo: 'BofA' },
  { name: 'Wells Fargo Bank, N.A.', routing: '121000247', rtp: true, fednow: true, logo: 'Wells Fargo' },
  { name: 'Citibank, N.A.', routing: '021100089', rtp: true, fednow: true, logo: 'Citi' },
  { name: 'Capital One, N.A.', routing: '051405515', rtp: true, fednow: true, logo: 'Capital One' },
  { name: 'US Bank, N.A.', routing: '091000022', rtp: true, fednow: true, logo: 'US Bank' },
];
