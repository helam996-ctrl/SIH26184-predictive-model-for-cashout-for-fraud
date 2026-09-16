/**
 * CyberSuraksha - AI Forensic Brief Generator Client
 * 
 * Invokes Claude or Gemini via /api/generate-brief to generate a 3-4 sentence
 * plain-language intelligence brief strictly framed for human officer review.
 */

import { EnrichedAlert } from "./liveFeedSimulator";

export interface ForensicBriefResult {
  brief: string;
  source: "claude" | "gemini" | "local_heuristic";
  model?: string;
  generatedAt: string;
}

/**
 * Calls the /api/generate-brief endpoint with structured alert telemetry
 */
export async function generateForensicBrief(alert: EnrichedAlert): Promise<ForensicBriefResult> {
  const { complaint, assessment } = alert;

  const requestBody = {
    complaintId: complaint.id,
    stolenAmount: complaint.stolenAmount,
    hopsCount: complaint.hopsCount,
    crimeCategory: complaint.crimeCategory,
    victimName: complaint.victimName,
    victimBank: complaint.victimBank,
    terminalAccount: complaint.terminalAccount,
    terminalBank: complaint.terminalBank,
    terminalHolderName: complaint.terminalHolderName,
    transferVelocity: complaint.transferVelocityInrPerMin,
    targetAtm: {
      bankName: complaint.targetAtm.bankName,
      address: complaint.targetAtm.address,
      distanceKm: complaint.targetAtm.distanceKm
    },
    urgencyMinutes: assessment.urgencyWindowMinutes,
    compositeScore: assessment.compositeScore,
    isDormantReactivated: complaint.isDormantReactivated,
    dormancyDays: complaint.dormancyDays
  };

  try {
    const response = await fetch("/api/generate-brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data: ForensicBriefResult = await response.json();
    return data;
  } catch (error) {
    console.warn("API route failed, utilizing client fallback brief...", error);

    // Fallback deterministic brief
    const amountFormatted = `₹${complaint.stolenAmount.toLocaleString("en-IN")}`;
    const velocityFormatted = `₹${complaint.transferVelocityInrPerMin.toLocaleString("en-IN")}/min`;

    const fallbackBrief = `Preliminary PaySim telemetry for incident ${complaint.id} reveals an initial ${complaint.crimeCategory} debit of ${amountFormatted} from ${complaint.victimName} (${complaint.victimBank}). The stolen capital was layered across ${complaint.hopsCount} intermediary mule accounts at ${velocityFormatted}, terminating in ${complaint.terminalBank} account ${complaint.terminalAccount}${complaint.isDormantReactivated ? ` (reactivated after ${complaint.dormancyDays} days dormancy)` : ""}. Geospatial models project a physical cash-out attempt at ${complaint.targetAtm.bankName} ATM in ${complaint.anchorArea}, leaving an estimated ~${assessment.urgencyWindowMinutes} minutes for interdiction. The investigating officer is advised to review Section 102 BNSS statutory debit freeze recommendations before physical cash withdrawal.`;

    return {
      brief: fallbackBrief,
      source: "local_heuristic",
      generatedAt: new Date().toISOString()
    };
  }
}
