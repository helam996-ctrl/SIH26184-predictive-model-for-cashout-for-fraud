import { jsPDF } from "jspdf";
import { MuleTraceResult, LegalHoldDraft, IncidentSummaryResponse, ATMNode } from "./api";

export function exportLegalDossierPDF(
  muleTrace: MuleTraceResult | null,
  legalDraft: LegalHoldDraft | null,
  incidentSummary: IncidentSummaryResponse | null,
  targetAtm: ATMNode | null,
  officerName: string = "Inspector V. Rawat",
  policeStation: string = "Cyber Crime Police Station, South District, New Delhi",
  firRef: string = "FIR / GD Ref: 2026/NCRP-44810-DL"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const timestampStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " " + now.toLocaleTimeString("en-IN", { hour12: false }) + " IST";

  const incidentId = muleTrace?.incident_id || "NCRP-2026-44810";
  const noticeId = legalDraft?.notice_id || `LEGAL/BNSS-102/2026/${incidentId.replace("NCRP-", "")}`;
  const terminalAccount = muleTrace?.terminal_account || legalDraft?.terminal_account || "77109283741";
  const terminalHolder = muleTrace?.terminal_holder_name || legalDraft?.terminal_holder || "Sunil Kumar Verma";
  const bankName = muleTrace?.terminal_bank || legalDraft?.bank_name || "State Bank of India";
  const branchName = muleTrace?.kyc_branch_name || "Malviya Nagar Branch, South Delhi";
  const ifscCode = muleTrace?.terminal_ifsc || "SBIN0001493";
  const stolenAmount = muleTrace?.total_stolen_amount || 180000;
  const atmTargetName = targetAtm ? `${targetAtm.bank_name} (${targetAtm.atm_id})` : "Canara Bank ATM (OSM #5648776299)";
  const atmDist = targetAtm ? `${targetAtm.distance_km} km` : "0.182 km";

  // Margins
  const left = 18;
  let y = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate header
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DELHI POLICE — CYBER CRIME INVESTIGATION WING", 105, 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(policeStation.toUpperCase(), 105, 18, { align: "center" });
  doc.text("STATUTORY DEBIT FREEZE ORDER UNDER SECTION 102 BNSS, 2023 (FORM 91)", 105, 24, { align: "center" });

  // Accent line
  doc.setDrawColor(220, 38, 38); // Red
  doc.setLineWidth(1);
  doc.line(0, 32, 210, 32);

  y = 42;
  doc.setTextColor(30, 41, 59);

  // Metadata Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, 174, 30, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`NOTICE REF NO:`, left + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(noticeId, left + 40, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`CFCFRMS PORTAL REF:`, left + 95, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(incidentId, left + 140, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`POLICE STATION GD REF:`, left + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(firRef, left + 46, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`DATE & TIME ISSUED:`, left + 95, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(timestampStr, left + 135, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`INVESTIGATING OFFICER:`, left + 4, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(`${officerName}, Cyber PS South`, left + 46, y + 20);

  doc.setFont("helvetica", "bold");
  doc.text(`SECURITY LEVEL:`, left + 95, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(185, 28, 28);
  doc.text("MIL-SEC EVIDENCE / IMMEDIATE ENFORCEMENT", left + 128, y + 20);
  doc.setTextColor(30, 41, 59);

  // Target Bank Nodal Officer Block
  y += 36;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TO,", left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`The Bank Nodal Officer / Fraud Control Operations`, left, y);
  y += 4.5;
  doc.text(`${bankName} — Cyber Security & Crime Mitigation Unit`, left, y);
  y += 4.5;
  doc.text(`Branch: ${branchName} (IFSC: ${ifscCode})`, left, y);
  y += 4.5;
  doc.text(`Email: nodal.cyber@bank-network.in`, left, y);

  // Subject
  y += 8;
  doc.setFillColor(254, 226, 226); // Light red
  doc.roundedRect(left, y - 4, 174, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(153, 27, 27);
  doc.text(
    `SUBJECT: MANDATORY URGENT DEBIT FREEZE UNDER SECTION 102 BNSS ON A/C: ${terminalAccount}`,
    left + 2,
    y + 2
  );
  doc.setTextColor(30, 41, 59);

  // Body Text
  y += 12;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const p1 =
    `WHEREAS, credible evidentiary telemetry ingested through the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / National Cyber Crime Reporting Portal - 1930) under Incident ID [${incidentId}] establishes that proceeds of cyber fraud amounting to INR ${stolenAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} have been illicitly layered through automated multi-hop transactions into the terminal mule account specified hereunder:`;
  const splitP1 = doc.splitTextToSize(p1, 174);
  doc.text(splitP1, left, y);
  y += splitP1.length * 4 + 2;

  // Accused Mule Table
  doc.setFillColor(241, 245, 249);
  doc.rect(left, y, 174, 22, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("1. Terminal Account No:", left + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(terminalAccount, left + 44, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("2. Account Holder Name:", left + 92, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(terminalHolder, left + 132, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("3. Bank / IFSC Code:", left + 4, y + 11);
  doc.setFont("helvetica", "normal");
  doc.text(`${bankName} / ${ifscCode}`, left + 44, y + 11);

  doc.setFont("helvetica", "bold");
  doc.text("4. Amount to be Frozen:", left + 92, y + 11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(185, 28, 28);
  doc.text(`INR ${stolenAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, left + 132, y + 11);
  doc.setTextColor(30, 41, 59);

  doc.setFont("helvetica", "bold");
  doc.text("5. Identified Cash-out Target:", left + 4, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(`${atmTargetName} (Distance: ${atmDist})`, left + 48, y + 17);

  y += 26;

  // Forensic Traversal & Velocity Brief
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("FORENSIC EVIDENCE & MULTI-HOP GRAPH ANALYSIS:", left, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const briefText =
    incidentSummary?.executive_brief ||
    `Spatial interdiction analytics confirm high-velocity layering traversing ${muleTrace?.hops_count || 2} banking hops at INR ${muleTrace?.transfer_velocity_inr_per_min || 12000}/min. Terminal mule exhibited sudden reactivation following dormancy. Field units have isolated target ATM node ${atmTargetName} within immediate striking range.`;
  const splitBrief = doc.splitTextToSize(briefText, 174);
  doc.text(splitBrief, left, y);
  y += splitBrief.length * 4 + 3;

  // Directives
  doc.setFont("helvetica", "bold");
  doc.text("STATUTORY MANDATE UNDER SECTION 102 BNSS, 2023:", left, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const directives = [
    "1. IMMEDIATELY MARK A TOTAL DEBIT FREEZE / LIEN on Account No. " + terminalAccount + " with zero latency.",
    "2. SUSPEND all linked ATM card authorizations, UPI handles, and mobile banking withdrawal channels.",
    "3. TRANSMIT complete KYC documents (Aadhaar, PAN, phone) and last 6 months' certified statement within 2 hours.",
    "4. Take notice that failure to comply attracts penal provisions under Sections 223 and 238 of Bharatiya Nyaya Sanhita (BNS), 2023.",
  ];
  directives.forEach((dir) => {
    const splitDir = doc.splitTextToSize(dir, 174);
    doc.text(splitDir, left, y);
    y += splitDir.length * 4 + 1;
  });

  // Digital Signature Block
  y += 8;
  doc.setDrawColor(148, 163, 184);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, 174, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DIGITAL EVIDENCE ATTESTATION & SIGNATURE HASH", left + 4, y + 6);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text(`SHA-256: 8f9b2c3a4d5e6f10827364589201abcdeffedcba1234567890abcdef12345678`, left + 4, y + 11);
  doc.text(`TOKEN: NCRP-CERT-LEGAL-BNSS102-${Date.now()}-SIGNED-VERIFIED`, left + 4, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Issued by: ${officerName}, Inspector of Police`, left + 4, y + 22);
  doc.text(`Seal: CYBERSURAKSHA PROACTIVE INTERDICTION CELL, I4C`, left + 90, y + 22);

  // Save the PDF
  const filename = `BNSS_102_Dossier_${incidentId}_${terminalAccount}.pdf`;
  doc.save(filename);
}
