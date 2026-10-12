import { jsPDF } from 'jspdf';
import { Claim, ClaimDocument } from '../types';

export interface ExportPDFOptions {
  includeAuditTrail?: boolean;
  includeFinancialSummary?: boolean;
  includeDocumentsList?: boolean;
  includeFraudRiskForensics?: boolean;
}

export function generateClaimPDFReport(claim: Claim, options: ExportPDFOptions = {}) {
  const {
    includeAuditTrail = true,
    includeFinancialSummary = true,
    includeDocumentsList = true,
    includeFraudRiskForensics = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
      return true;
    }
    return false;
  };

  const drawHeaderWatermark = () => {
    // Top subtle bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 0.5, 'F');
    y += 4;
  };

  // ========================
  // 1. BRAND HEADER & REPORT TITLE
  // ========================
  // Primary dark banner header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  // Logo / System Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CLAIMFLOW INSURANCE PLATFORM', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL CLAIM DOSSIER & COMPREHENSIVE AUDIT TRAIL RECORD', margin + 6, y + 16);

  // Status Badge on Header Right
  const statusColorMap: Record<string, [number, number, number]> = {
    APPROVED: [16, 185, 129], // emerald
    PAYOUT_SETTLED: [16, 185, 129],
    PAYOUT_INITIATED: [59, 130, 246], // blue
    DOCS_UNDER_REVIEW: [234, 179, 8], // amber
    ADJUSTER_ASSESSMENT: [168, 85, 247], // purple
    SUBMITTED: [59, 130, 246],
    DRAFT: [148, 163, 184],
    REJECTED: [239, 68, 68], // red
  };

  const badgeColor = statusColorMap[claim.status] || [59, 130, 246];
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - margin - 48, y + 6, 42, 12, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(claim.status.replace(/_/g, ' '), pageWidth - margin - 27, y + 13.5, { align: 'center' });

  y += 28;

  // ========================
  // 2. CLAIM IDENTIFICATION BAR
  // ========================
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 16, 1, 1, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(margin, y, contentWidth, 16, 'S');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.text('CLAIM NUMBER:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(claim.claimNumber, margin + 4, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('POLICY NUMBER:', margin + 44, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(claim.policyNumber, margin + 44, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('COVERAGE TYPE:', margin + 92, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(claim.policyType, margin + 92, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT GENERATED:', margin + 138, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }), margin + 138, y + 12);

  y += 21;

  // ========================
  // 3. CLAIMANT & INCIDENT DETAILS (2 COLUMNS)
  // ========================
  const colWidth = (contentWidth - 4) / 2;
  const colHeight = 38;

  // Left Box: Claimant Info
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, colWidth, colHeight, 1, 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, colWidth, colHeight, 'S');

  doc.setFillColor(224, 231, 255); // light indigo
  doc.rect(margin, y, colWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // indigo-900
  doc.text('INSURED CLAIMANT INFORMATION', margin + 4, y + 4.5);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Full Legal Name:', margin + 4, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(claim.claimant.name, margin + 32, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Contact Email:', margin + 4, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(claim.claimant.email || 'N/A', margin + 32, y + 18);

  doc.setTextColor(100, 116, 139);
  doc.text('Phone Number:', margin + 4, y + 24);
  doc.setTextColor(15, 23, 42);
  doc.text(claim.claimant.phone || 'N/A', margin + 32, y + 24);

  doc.setTextColor(100, 116, 139);
  doc.text('Insured Address:', margin + 4, y + 30);
  doc.setTextColor(15, 23, 42);
  const splitAddress = doc.splitTextToSize(claim.claimant.address || 'N/A', colWidth - 36);
  doc.text(splitAddress[0] || 'N/A', margin + 32, y + 30);

  // Right Box: Incident Details
  const col2X = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, colHeight, 1, 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(col2X, y, colWidth, colHeight, 'S');

  doc.setFillColor(254, 243, 199); // light amber
  doc.rect(col2X, y, colWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('INCIDENT & LOSS OCCURRENCE', col2X + 4, y + 4.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Incident Date:', col2X + 4, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(claim.incident.date, col2X + 28, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Location:', col2X + 4, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(claim.incident.location, col2X + 28, y + 18);

  doc.setTextColor(100, 116, 139);
  doc.text('Estimated Loss:', col2X + 4, y + 24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${claim.incident.estimatedLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col2X + 28, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Description:', col2X + 4, y + 30);
  doc.setTextColor(51, 65, 85);
  const splitDesc = doc.splitTextToSize(claim.incident.description || 'N/A', colWidth - 32);
  doc.text(splitDesc[0] || 'N/A', col2X + 28, y + 30);

  y += colHeight + 5;

  // ========================
  // 4. FINANCIAL SETTLEMENT BREAKDOWN
  // ========================
  if (includeFinancialSummary) {
    checkPageBreak(38);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 32, 1, 1, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 32, 'S');

    doc.setFillColor(224, 242, 254); // sky
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text('FINANCIAL SETTLEMENT AUDIT & BANKING DISBURSEMENT BREAKDOWN', margin + 4, y + 4.5);

    const fBoxWidth = (contentWidth - 6) / 4;
    const fMetrics = [
      { label: 'CLAIMED LOSS', value: `₹${claim.claimedAmount.toLocaleString()}`, color: [30, 41, 59] },
      { label: 'APPROVED GROSS', value: `₹${claim.approvedAmount.toLocaleString()}`, color: [16, 185, 129] },
      { label: 'APPLIED DEDUCTIBLE', value: `-₹${claim.deductible.toLocaleString()}`, color: [225, 29, 72] },
      { label: 'NET PAYOUT ISSUED', value: `₹${claim.netPayout.toLocaleString()}`, color: [14, 165, 233] },
    ];

    fMetrics.forEach((metric, i) => {
      const bx = margin + 2 + i * (fBoxWidth + 1);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(bx, y + 8, fBoxWidth - 1, 14, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(bx, y + 8, fBoxWidth - 1, 14, 'S');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(metric.label, bx + 2, y + 12);

      doc.setFontSize(10);
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.text(metric.value, bx + 2, y + 18.5);
    });

    // Banking Rail note
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const bankDetailsStr = claim.bankDetails
      ? `Beneficiary Account: ${claim.bankDetails.bankName} (${claim.bankDetails.accountNumberMasked}) • Routing: ${claim.bankDetails.routingNumber} • Status: ${claim.bankDetails.verificationStatus}`
      : 'Beneficiary Account: Pending Bank Verification';
    
    const payoutStr = claim.payoutTransaction
      ? `Disbursement: ${claim.payoutTransaction.rail} • Status: ${claim.payoutTransaction.status} • FedNow Trace: ${claim.payoutTransaction.fedNowTraceId || 'N/A'} • Latency: ${claim.payoutTransaction.latencySeconds}s`
      : 'Disbursement: Awaiting Settlement Trigger';

    doc.text(`${bankDetailsStr} | ${payoutStr}`, margin + 4, y + 28);

    y += 36;
  }

  // ========================
  // 5. AI FORENSICS & FRAUD INTEGRITY
  // ========================
  if (includeFraudRiskForensics && claim.aiFraudRisk) {
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 20, 1, 1, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 20, 'S');

    doc.setFillColor(243, 232, 255); // purple
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 33, 168);
    doc.text('AUTOMATED RISK INTELLIGENCE & FRAUD VERIFICATION SCORE', margin + 4, y + 4);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Overall Risk Level: ${claim.aiFraudRisk.riskLevel}`, margin + 4, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fraud Score: ${claim.aiFraudRisk.overallScore}/100`, margin + 55, y + 10.5);
    doc.text(
      `Fast-Track STP Eligible: ${claim.aiFraudRisk.autoApproveEligible ? 'YES (Straight-Through Processing)' : 'NO (Manual Review Required)'}`,
      margin + 95,
      y + 10.5
    );

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const reasoningSplit = doc.splitTextToSize(`Reasoning: ${claim.aiFraudRisk.reasoning}`, contentWidth - 8);
    doc.text(reasoningSplit[0] || '', margin + 4, y + 16);

    y += 24;
  }

  // ========================
  // 6. SUPPORTING DOCUMENT REPERTORY
  // ========================
  if (includeDocumentsList && claim.documents.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`SUPPORTING EVIDENCE & DOCUMENT AUDIT (${claim.documents.length} ATTACHMENTS)`, margin, y);
    y += 3;

    // Document Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 2, y + 4);
    doc.text('DOCUMENT NAME', margin + 8, y + 4);
    doc.text('CATEGORY', margin + 65, y + 4);
    doc.text('UPLOAD DATE', margin + 105, y + 4);
    doc.text('SIZE', margin + 135, y + 4);
    doc.text('OCR / VERIFICATION', margin + 152, y + 4);
    y += 6;

    claim.documents.forEach((d: ClaimDocument, idx: number) => {
      checkPageBreak(7);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 6, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(idx + 1), margin + 2, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const docName = d.name.length > 28 ? d.name.slice(0, 26) + '...' : d.name;
      doc.text(docName, margin + 8, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(d.category, margin + 65, y + 4.2);
      doc.text(new Date(d.uploadDate).toLocaleDateString(), margin + 105, y + 4.2);
      doc.text(d.size || 'N/A', margin + 135, y + 4.2);

      if (d.aiAnalysis?.verified) {
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(`Verified (₹${d.aiAnalysis.extractedAmount.toLocaleString()})`, margin + 152, y + 4.2);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('Pending Review', margin + 152, y + 4.2);
      }

      y += 6.5;
    });

    y += 4;
  }

  // ========================
  // 7. COMPREHENSIVE AUDIT TRAIL LOG
  // ========================
  if (includeAuditTrail) {
    checkPageBreak(35);

    // Build unified chronological events
    const events: Array<{
      id: string;
      title: string;
      timestamp: string;
      actor: string;
      type: string;
      note: string;
      hash: string;
    }> = [];

    // Timeline events
    claim.timeline.forEach((item, index) => {
      events.push({
        id: item.id || `tl-${index}`,
        title: item.title,
        timestamp: item.timestamp,
        actor: item.actor,
        type: item.stage || 'STATUS_UPDATE',
        note: item.note,
        hash: `0x${Math.abs(item.timestamp.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)).toString(16).padStart(8, '0').toUpperCase().slice(0, 10)}`,
      });
    });

    // Payout transaction if any
    if (claim.payoutTransaction) {
      const p = claim.payoutTransaction;
      if (!events.some((e) => e.note.includes(p.transactionId))) {
        events.push({
          id: `payout-${p.transactionId}`,
          title: `Direct Banking Settlement Cleared (${p.rail})`,
          timestamp: p.settledAt || p.initiatedAt,
          actor: 'FedNow / RTP Banking Clearinghouse',
          type: 'PAYOUT_SETTLED',
          note: `Disbursed ₹${p.amount.toLocaleString()} to claimant beneficiary bank. Trace: ${p.fedNowTraceId || 'CLR-ACK'}`,
          hash: `0x${p.transactionId.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase()}`,
        });
      }
    }

    // Sort chronologically ascending for official audit record
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`IMMUTABLE AUDIT TRAIL & LIFECYCLE EVENT LOG (${events.length} LOGGED ACTIONS)`, margin, y);
    y += 3;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TIMESTAMP (UTC)', margin + 2, y + 4);
    doc.text('EVENT & ACTION DESCRIPTION', margin + 36, y + 4);
    doc.text('ACTOR / SYSTEM', margin + 115, y + 4);
    doc.text('CRYPTOGRAPHIC HASH', margin + 150, y + 4);
    y += 6;

    events.forEach((evt, idx) => {
      // Estimate event row height based on note length
      const noteLines = doc.splitTextToSize(evt.note, contentWidth - 42);
      const rowHeight = Math.max(7, 4.5 + noteLines.length * 3);

      checkPageBreak(rowHeight + 2);

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowHeight, 'S');

      // Timestamp
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const formattedDate = new Date(evt.timestamp).toISOString().replace('T', ' ').slice(0, 19);
      doc.text(formattedDate, margin + 2, y + 3.8);

      // Title & Note
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(evt.title, margin + 36, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(noteLines, margin + 36, y + 7);

      // Actor
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const actorTrimmed = evt.actor.length > 20 ? evt.actor.slice(0, 18) + '...' : evt.actor;
      doc.text(actorTrimmed, margin + 115, y + 3.8);

      // Hash
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(79, 70, 229); // indigo
      doc.text(evt.hash, margin + 150, y + 3.8);

      y += rowHeight + 1;
    });
  }

  // ========================
  // 8. LEGAL DISCLAIMER & FOOTER
  // ========================
  checkPageBreak(20);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 0.5, 'S');
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const footerText =
    'This electronic audit transcript is generated by ClaimFlow Instant Insurance Payout Platform. Certified record for insurance compliance, underwriting verification, and banking reconciliation under FedNow / RTP clearing regulations. All event hashes are cryptographic ledger proofs.';
  const footerLines = doc.splitTextToSize(footerText, contentWidth);
  doc.text(footerLines, margin, y);

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ClaimFlow Dossier • Claim Ref: ${claim.claimNumber} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger download
  const cleanClaimNum = claim.claimNumber.replace(/[^A-Za-z0-9_-]/g, '_');
  doc.save(`Claim_${cleanClaimNum}_Audit_Report.pdf`);
}
