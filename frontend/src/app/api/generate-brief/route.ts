/**
 * Next.js API Route: /api/generate-brief
 * 
 * Generates an advisory Forensic Intelligence Brief for human officer review using
 * Claude (Anthropic) or Gemini API, with deterministic offline fallback.
 * 
 * Mandatory Framing:
 * - System prompt strictly enforces advisory summary formulation
 * - Never frames output as an autonomous enforcement order
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a cybercrime financial forensic intelligence assistant for the "Cyber Suraksha" interdiction workstation.
Your task: Generate a concise 3-4 sentence plain-language forensic summary strictly for human law-enforcement officer review.
CRITICAL INSTRUCTIONS:
1. NEVER frame your output as an autonomous enforcement order, statutory directive, or execution dispatch.
2. Clearly frame all statements as advisory observations for human officer sign-off and verification.
3. Highlight:
   - The initial fraud category and victim debit
   - Layering transfer velocity and multi-hop mule dispersion
   - Dormant account reactivation signals (if applicable)
   - The predicted cash-out ATM corridor and response urgency window
4. Keep the tone objective, analytical, and utilitarian. Exactly 3 to 4 sentences.`;

interface BriefRequestBody {
  complaintId: string;
  stolenAmount: number;
  hopsCount: number;
  crimeCategory: string;
  victimName: string;
  victimBank: string;
  terminalAccount: string;
  terminalBank: string;
  terminalHolderName: string;
  transferVelocity: number;
  targetAtm: {
    bankName: string;
    address: string;
    distanceKm: number;
  };
  urgencyMinutes: number;
  compositeScore: number;
  isDormantReactivated: boolean;
  dormancyDays: number;
}

/**
 * Deterministic local fallback generator if no LLM API keys are provided
 */
function generateDeterministicBrief(data: BriefRequestBody): string {
  const amountStr = `₹${data.stolenAmount.toLocaleString("en-IN")}`;
  const velocityStr = `₹${data.transferVelocity.toLocaleString("en-IN")}/min`;
  
  const sentence1 = `Preliminary PaySim telemetry for incident ${data.complaintId} indicates an initial ${data.crimeCategory} debit of ${amountStr} originating from ${data.victimName}'s ${data.victimBank} account.`;
  
  let sentence2 = `The stolen capital was rapidly dispersed across ${data.hopsCount} intermediary mule accounts at a velocity of ${velocityStr}, terminating at ${data.terminalBank} account ${data.terminalAccount}.`;
  if (data.isDormantReactivated) {
    sentence2 = `The stolen capital was dispersed across ${data.hopsCount} intermediary mule hops at an automated velocity of ${velocityStr}, abruptly reactivating a dormant ${data.terminalBank} mule account (${data.terminalHolderName}) inactive for ${data.dormancyDays} days.`;
  }

  const sentence3 = `Geospatial correlation models project an immediate cash-withdrawal exit attempt at ${data.targetAtm.bankName} ATM (${data.targetAtm.address}), with an estimated tactical intervention window of ~${data.urgencyMinutes} minutes remaining.`;

  const sentence4 = `It is respectfully recommended for the reviewing officer to verify KYC discrepancies and consider issuing a Section 102 BNSS statutory debit freeze notice to the bank nodal contact alongside local beat patrol verification.`;

  return `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: BriefRequestBody = await request.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try Claude (Anthropic API) if key is present
    if (anthropicKey) {
      try {
        const userPrompt = `Generate a 3-4 sentence advisory forensic summary for officer review with the following case data:
- Case ID: ${body.complaintId}
- Crime Category: ${body.crimeCategory}
- Victim: ${body.victimName} (${body.victimBank})
- Amount: INR ${body.stolenAmount.toLocaleString("en-IN")}
- Layering Hops: ${body.hopsCount} hops
- Transfer Velocity: INR ${body.transferVelocity.toLocaleString("en-IN")}/min
- Terminal Mule Sink: ${body.terminalHolderName} (${body.terminalBank}, A/C: ${body.terminalAccount})
- Dormancy Status: ${body.isDormantReactivated ? `Reactivated after ${body.dormancyDays} days dormant` : "Active account"}
- Predicted Cashout ATM: ${body.targetAtm.bankName} ATM, ${body.targetAtm.address} (${body.targetAtm.distanceKm} km from KYC anchor)
- Composite Risk Score: ${body.compositeScore}/100
- Estimated Urgency Window: ~${body.urgencyMinutes} minutes`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const brief = data.content?.[0]?.text;
          if (brief) {
            return NextResponse.json({
              brief: brief.trim(),
              source: "claude",
              generatedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn("Claude API call failed, falling back...", err);
      }
    }

    // 2. Try Gemini API if key is present
    if (geminiKey) {
      try {
        const geminiPrompt = `${SYSTEM_PROMPT}\n\nCase Telemetry Data:\n- Case ID: ${body.complaintId}\n- Category: ${body.crimeCategory}\n- Victim: ${body.victimName} (${body.victimBank})\n- Amount: INR ${body.stolenAmount.toLocaleString("en-IN")}\n- Velocity: INR ${body.transferVelocity.toLocaleString("en-IN")}/min across ${body.hopsCount} hops\n- Terminal Sink: ${body.terminalHolderName} (${body.terminalBank}, A/C: ${body.terminalAccount})\n- Dormancy: ${body.isDormantReactivated ? `Reactivated after ${body.dormancyDays} days dormant` : "Active"}\n- Predicted Exit ATM: ${body.targetAtm.bankName} ATM, ${body.targetAtm.address}\n- Urgency Window: ~${body.urgencyMinutes} minutes\n- Risk Score: ${body.compositeScore}/100\n\nWrite exactly 3 to 4 sentences advisory summary for officer review:`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: { maxOutputTokens: 350, temperature: 0.3 }
            })
          }
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({
              brief: text.trim(),
              source: "gemini",
              model: "gemini-3.6-flash",
              generatedAt: new Date().toISOString()
            });
          }
        } else {
          const errText = await geminiRes.text();
          console.error("[Gemini 3.6 Flash Error]:", geminiRes.status, errText);
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back...", err);
      }
    }

    // 3. Graceful Deterministic Fallback
    const fallbackBrief = generateDeterministicBrief(body);
    return NextResponse.json({
      brief: fallbackBrief,
      source: "local_heuristic",
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate forensic brief",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
