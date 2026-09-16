import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// ---------- Bank Freeze Email ----------
async function sendBankFreezeEmail(body: any) {
  const {
    incidentId = "NCRP-2024-8841",
    recipientEmail = "helam996@gmail.com",
    bankName = "State Bank of India",
    terminalAccount = "38920194819",
    terminalHolder = "Vikram K. (Designated Mule)",
    frozenAmount = 85000,
    issuingOfficer = "Inspector Vikram Rawat",
    issuingBadge = "DL-CYBER-8841",
    noticeBody,
  } = body;

  const noticeId = `CS-BNSS-102-${incidentId.replace("NCRP-", "")}-${Date.now().toString().slice(-4)}`;
  const emailSubject = `URGENT: Section 102 BNSS Statutory Debit Lien Notice - Account ${terminalAccount} [Ref: ${noticeId}]`;
  const emailContent =
    noticeBody ||
    `OFFICE OF THE DESIGNATED INVESTIGATING OFFICER
CYBER CRIME INVESTIGATION CELL • MINISTRY OF HOME AFFAIRS (I4C)
GOVERNMENT OF INDIA

Ref No: ${noticeId}
Statutory Authority: Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
Incident ID: ${incidentId}

To:
The Bank Nodal Officer / Fraud Risk Management (FRM)
${bankName}

Subject: STATUTORY PROVISIONAL DEBIT FREEZE & LIEN ORDER (FORM 91)

Sir / Madam,
In exercise of powers conferred under Section 102 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 read with Section 69B of the Information Technology Act, 2000, you are hereby ordered to immediately place an administrative debit freeze and statutory lien upon the following beneficiary account:

- Terminal Account No: ${terminalAccount}
- Account Holder Name: ${terminalHolder}
- Bank / Branch: ${bankName}
- Statutory Lien Value: INR ${Number(frozenAmount).toLocaleString("en-IN")}
- Reason: Layered cybercrime proceeds identified in pre-ATM cash-out transit.

You are further directed to preserve complete transaction logs, IP access logs, and CCTV footage corresponding to this account for transmission to the investigating agency.

Issued by:
${issuingOfficer}
Badge ID: ${issuingBadge}
Designated Investigating Officer, Cyber Crime Cell
CyberSuraksha National Interdiction Gateway (SIH 26184)`;

  let resendId: string | null = null;
  let dispatchStatus = "FAILED";
  let statusMessage = "";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CyberSuraksha Notice <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailSubject,
        text: emailContent,
      }),
    });

    const resData = await res.json();
    if (res.ok && resData.id) {
      resendId = resData.id;
      dispatchStatus = "SENT_LIVE";
      statusMessage = `Section 102 lien notice delivered to ${recipientEmail} (Resend ID: ${resData.id})`;
    } else {
      statusMessage = `Resend API Error: ${resData.message || JSON.stringify(resData)}`;
      dispatchStatus = "FAILED_API";
    }
  } catch (err: any) {
    statusMessage = `Network error calling Resend: ${err.message}`;
    dispatchStatus = "FAILED_NETWORK";
  }

  // Persist
  try {
    await supabase.from("legal_holds").insert([
      {
        notice_id: noticeId,
        incident_id: incidentId,
        statutory_authority: "Section 102 BNSS, 2023 / Form 91",
        bank_name: bankName,
        nodal_officer_email: recipientEmail,
        terminal_account: terminalAccount,
        terminal_holder: terminalHolder,
        frozen_amount: frozenAmount,
        issuing_officer: issuingOfficer,
        issuing_badge: issuingBadge,
        status: dispatchStatus === "SENT_LIVE" ? "DISPATCHED" : "PENDING_DISPATCH",
      },
    ]);
    await supabase.from("dispatch_logs").insert([
      {
        incident_id: incidentId,
        dispatch_type: "BANK_EMAIL",
        recipient: recipientEmail,
        status: dispatchStatus,
        external_provider_id: resendId,
        payload_summary: `Section 102 lien notice sent to ${recipientEmail} for INR ${frozenAmount}`,
      },
    ]);
  } catch (dbErr) {
    console.warn("[Supabase Dispatch Log Warning]:", dbErr);
  }

  return { noticeId, resendId, dispatchStatus, statusMessage, recipientEmail };
}

// ---------- Patrol Alert Email ----------
async function sendPatrolAlertEmail(body: any) {
  const {
    incidentId = "NCRP-2024-8841",
    patrolUnitId = "PCR-ALPHA-402",
    stolenAmount = 85000,
    targetAtm = {
      atm_id: "ATM-SBI-SAK-01",
      bank_name: "State Bank of India",
      address: "Community Centre, Block M, Saket, New Delhi",
      latitude: 28.5244,
      longitude: 77.2066,
      distance_km: 0.4,
    },
    officerNotes = "Immediate physical interdiction required before cash dispense.",
    issuingOfficer = "Inspector Vikram Rawat",
    issuingBadge = "DL-CYBER-8841",
  } = body;

  const PATROL_EMAIL = "sumitsharmakhp996@gmail.com";
  const FALLBACK_EMAIL = "helam996@gmail.com";

  const googleMapsUrl = `https://maps.google.com/?q=${targetAtm.latitude},${targetAtm.longitude}`;
  const alertRef = `CS-PATROL-${incidentId.replace("NCRP-", "")}-${Date.now().toString().slice(-4)}`;

  const emailSubject = `[URGENT] CyberSuraksha Field Interdiction Alert — ${targetAtm.bank_name} ATM [Ref: ${alertRef}]`;
  const emailBody = `CYBERSURAKSHA NATIONAL INTERDICTION GATEWAY
POLICE FIELD PATROL ALERT — IMMEDIATE ACTION REQUIRED
SIH Project 26184 | Ministry of Home Affairs I4C

Alert Reference: ${alertRef}
Incident ID: ${incidentId}
Patrol Unit: ${patrolUnitId}
Issuing Officer: ${issuingOfficer} (Badge: ${issuingBadge})

=== TARGET ATM DETAILS ===
ATM ID        : ${targetAtm.atm_id}
Bank          : ${targetAtm.bank_name}
Address       : ${targetAtm.address}
GPS Coords    : ${targetAtm.latitude}, ${targetAtm.longitude}
Distance      : ${targetAtm.distance_km} km from origin
Cash at Risk  : INR ${Number(stolenAmount).toLocaleString("en-IN")}

=== GPS NAVIGATION LINK ===
${googleMapsUrl}

=== OPERATIONAL DIRECTIVE ===
${officerNotes}

=== ACTION REQUIRED ===
1. Proceed IMMEDIATELY to the above ATM location.
2. Prevent any cash withdrawal by flagged suspect.
3. Secure the ATM terminal and surrounding area.
4. Contact the Cyber Crime Cell Duty Officer on arrival.
5. Preserve CCTV footage and witness statements.

This is an automated dispatch from CyberSuraksha Predictive Interdiction System.
DO NOT IGNORE. Respond within 10 minutes of receipt.

CyberSuraksha | SIH 26184 | MHA I4C Division`;

  let resendId: string | null = null;
  let dispatchStatus = "FAILED";
  let statusMessage = "";
  let actualRecipient = PATROL_EMAIL;

  // Attempt 1: send directly to patrol officer
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CyberSuraksha Patrol Dispatch <onboarding@resend.dev>",
        to: [PATROL_EMAIL],
        subject: emailSubject,
        text: emailBody,
      }),
    });

    const resData = await res.json();
    if (res.ok && resData.id) {
      resendId = resData.id;
      dispatchStatus = "SENT_LIVE";
      actualRecipient = PATROL_EMAIL;
      statusMessage = `Police Patrol alert emailed to ${PATROL_EMAIL} (Resend ID: ${resData.id})`;
    } else if (res.status === 403) {
      // Resend sandbox restriction → fallback to registered email
      const fallbackSubject = `[POLICE PATROL ALERT — TARGET: ${PATROL_EMAIL}] ${emailSubject}`;
      const fallbackBody = `NOTE: Resend sandbox restriction prevented delivery to ${PATROL_EMAIL}.
This alert is forwarded to the registered owner email as a fallback.
To send directly to ${PATROL_EMAIL}, verify your domain at resend.com/domains.

=== ORIGINAL ALERT BELOW ===

${emailBody}`;

      const fallbackRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CyberSuraksha Patrol Dispatch <onboarding@resend.dev>",
          to: [FALLBACK_EMAIL],
          subject: fallbackSubject,
          text: fallbackBody,
        }),
      });
      const fallbackData = await fallbackRes.json();
      if (fallbackRes.ok && fallbackData.id) {
        resendId = fallbackData.id;
        dispatchStatus = "SENT_FALLBACK";
        actualRecipient = FALLBACK_EMAIL;
        statusMessage = `Patrol alert sent to fallback inbox ${FALLBACK_EMAIL} (sandboxed; target was ${PATROL_EMAIL}). Resend ID: ${fallbackData.id}`;
      } else {
        dispatchStatus = "FAILED_API";
        statusMessage = `Resend fallback error: ${fallbackData.message || JSON.stringify(fallbackData)}`;
      }
    } else {
      dispatchStatus = "FAILED_API";
      statusMessage = `Resend API Error: ${resData.message || JSON.stringify(resData)}`;
    }
  } catch (err: any) {
    dispatchStatus = "FAILED_NETWORK";
    statusMessage = `Network error calling Resend: ${err.message}`;
  }

  // Persist
  try {
    await supabase.from("dispatch_logs").insert([
      {
        incident_id: incidentId,
        dispatch_type: "PATROL_EMAIL",
        recipient: actualRecipient,
        status: dispatchStatus,
        external_provider_id: resendId,
        payload_summary: `Patrol alert for ${targetAtm.bank_name} ATM (${targetAtm.latitude}, ${targetAtm.longitude}) to ${actualRecipient}`,
      },
    ]);
  } catch (dbErr) {
    console.warn("[Supabase Dispatch Log Warning]:", dbErr);
  }

  return {
    alertRef,
    resendId,
    dispatchStatus,
    statusMessage,
    actualRecipient,
    targetEmail: PATROL_EMAIL,
    googleMapsUrl,
  };
}

// ---------- Main Route Handler ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailType: string = body.emailType || "BANK_FREEZE";

    if (emailType === "PATROL_ALERT") {
      const result = await sendPatrolAlertEmail(body);
      return NextResponse.json({
        success: result.dispatchStatus === "SENT_LIVE" || result.dispatchStatus === "SENT_FALLBACK",
        status: result.dispatchStatus,
        emailId: result.resendId,
        alertRef: result.alertRef,
        recipient: result.actualRecipient,
        targetEmail: result.targetEmail,
        googleMapsUrl: result.googleMapsUrl,
        message: result.statusMessage,
      });
    }

    // Default: BANK_FREEZE
    const result = await sendBankFreezeEmail(body);
    return NextResponse.json({
      success: result.dispatchStatus === "SENT_LIVE",
      status: result.dispatchStatus,
      noticeId: result.noticeId,
      emailId: result.resendId,
      recipient: result.recipientEmail,
      message: result.statusMessage,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e.message || "Failed to process email dispatch." },
      { status: 500 }
    );
  }
}
