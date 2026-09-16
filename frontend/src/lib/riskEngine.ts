/**
 * CyberSuraksha - Pure Risk Scoring Engine
 * 
 * Evaluates transactional telemetry derived from PaySim fraud distribution patterns
 * to compute a deterministic, weighted composite risk score (0 - 100).
 * 
 * Calibrated Weights:
 * 1. Layering Transfer Velocity: 35%
 * 2. Dormant Account Reactivation: 25%
 * 3. Proximity to Historical Cash-Out Hotspot: 20%
 * 4. Structural Signals (Hop Depth & Amount Magnitude): 20%
 * 
 * Advisory Formulation:
 * Delivers decision-support telemetry for human officer sign-off.
 * Never performs autonomous execution.
 */

import { MockComplaintRecord } from "./mockDataset";

export interface RiskSignalBreakdown {
  signalName: string;
  category: "velocity" | "dormancy" | "spatial" | "structural";
  rawValue: string;
  normalizedScore: number; // 0 - 100
  weightPercent: number; // e.g., 35
  weightedPoints: number; // (normalizedScore * weightPercent) / 100
  description: string;
}

export type ThreatClassification = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface RiskAssessment {
  recordId: string;
  compositeScore: number; // 0 - 100
  threatLevel: ThreatClassification;
  breakdown: RiskSignalBreakdown[];
  urgencyWindowMinutes: number;
  advisoryRecommendation: string;
  assessedAt: string;
}

/**
 * 1. Layering Transfer Velocity (35% Weight)
 * Evaluates the speed (INR/minute) at which funds are dispersed across accounts.
 * PaySim benchmarks: > ₹50,000/min indicates automated laundering scripts.
 */
export function calculateVelocityScore(velocityInrPerMin: number): number {
  if (velocityInrPerMin >= 80000) return 100;
  if (velocityInrPerMin >= 50000) return 85;
  if (velocityInrPerMin >= 30000) return 70;
  if (velocityInrPerMin >= 15000) return 50;
  if (velocityInrPerMin >= 8000) return 30;
  return Math.max(10, Math.round((velocityInrPerMin / 8000) * 25));
}

/**
 * 2. Dormant Account Reactivation (25% Weight)
 * Identifies mule accounts with prolonged inactivity (>120-180 days)
 * suddenly receiving high-volume multi-hop inflows.
 */
export function calculateDormancyScore(
  isDormantReactivated: boolean,
  dormancyDays: number,
  terminalAccountAgeDays: number
): number {
  if (isDormantReactivated) {
    if (dormancyDays >= 300) return 100;
    if (dormancyDays >= 180) return 90;
    return 75;
  }

  // If newly created mule account (< 30 days old)
  if (terminalAccountAgeDays <= 30) return 60;
  if (terminalAccountAgeDays <= 90) return 35;
  return 10;
}

/**
 * 3. Proximity to Historical Cash-Out Hotspot (20% Weight)
 * Gauges physical distance to known high-frequency withdrawal clusters.
 * Within 300m represents immediate physical cash-out risk.
 */
export function calculateProximityScore(distanceToHotspotKm: number): number {
  if (distanceToHotspotKm <= 0.2) return 100;
  if (distanceToHotspotKm <= 0.4) return 85;
  if (distanceToHotspotKm <= 0.75) return 65;
  if (distanceToHotspotKm <= 1.2) return 40;
  if (distanceToHotspotKm <= 2.0) return 20;
  return 5;
}

/**
 * 4. Structural Signals: Hop Count Depth & Amount Magnitude (20% Weight)
 * Multi-layering (3-4 hops) with amounts > ₹3,00,000 indicates organized syndicates.
 */
export function calculateStructuralScore(hopsCount: number, stolenAmount: number): number {
  let hopPoints = 0;
  if (hopsCount >= 4) hopPoints = 50;
  else if (hopsCount === 3) hopPoints = 40;
  else if (hopsCount === 2) hopPoints = 25;
  else hopPoints = 10;

  let amountPoints = 0;
  if (stolenAmount >= 700000) amountPoints = 50;
  else if (stolenAmount >= 400000) amountPoints = 40;
  else if (stolenAmount >= 150000) amountPoints = 25;
  else amountPoints = 10;

  return Math.min(100, hopPoints + amountPoints);
}

/**
 * Pure evaluation function generating a composite risk assessment
 */
export function evaluateRiskScore(record: MockComplaintRecord): RiskAssessment {
  // 1. Layering velocity (35%)
  const velocityNorm = calculateVelocityScore(record.transferVelocityInrPerMin);
  const velocityWeighted = (velocityNorm * 35) / 100;

  // 2. Dormant reactivation (25%)
  const dormancyNorm = calculateDormancyScore(
    record.isDormantReactivated,
    record.dormancyDays,
    record.terminalAccountAgeDays
  );
  const dormancyWeighted = (dormancyNorm * 25) / 100;

  // 3. Proximity to historical hotspot (20%)
  const proximityNorm = calculateProximityScore(record.proximityToHistoricalHotspotKm);
  const proximityWeighted = (proximityNorm * 20) / 100;

  // 4. Structural depth & amount (20%)
  const structuralNorm = calculateStructuralScore(record.hopsCount, record.stolenAmount);
  const structuralWeighted = (structuralNorm * 20) / 100;

  // Composite calculation
  const totalScore = Math.round(
    velocityWeighted + dormancyWeighted + proximityWeighted + structuralWeighted
  );
  const compositeScore = Math.min(100, Math.max(0, totalScore));

  // Classification
  let threatLevel: ThreatClassification = "LOW";
  let urgencyWindowMinutes = 60;
  let advisoryRecommendation = "";

  if (compositeScore >= 75) {
    threatLevel = "CRITICAL";
    urgencyWindowMinutes = Math.max(15, Math.round(45 - (compositeScore - 75) * 1.2));
    advisoryRecommendation = `Recommend urgent officer review for Section 102 BNSS statutory debit freeze and nearest beat patrol tactical verification at ${record.targetAtm.bankName} ATM.`;
  } else if (compositeScore >= 60) {
    threatLevel = "HIGH";
    urgencyWindowMinutes = 45;
    advisoryRecommendation = `Recommend supervisory review of terminal account ${record.terminalAccount} and alert transmission to bank nodal contact.`;
  } else if (compositeScore >= 40) {
    threatLevel = "MODERATE";
    urgencyWindowMinutes = 90;
    advisoryRecommendation = `Flag for queue triage; verify beneficiary KYC credentials prior to formal freeze advisory.`;
  } else {
    threatLevel = "LOW";
    urgencyWindowMinutes = 180;
    advisoryRecommendation = `Standard complaint intake; retain in analytical stream for pattern aggregation.`;
  }

  const breakdown: RiskSignalBreakdown[] = [
    {
      signalName: "Layering Transfer Velocity",
      category: "velocity",
      rawValue: `₹${record.transferVelocityInrPerMin.toLocaleString()}/min`,
      normalizedScore: velocityNorm,
      weightPercent: 35,
      weightedPoints: Math.round(velocityWeighted * 10) / 10,
      description: "Speed of multi-rail fund dispersion across intermediary accounts."
    },
    {
      signalName: "Dormant Account Reactivation",
      category: "dormancy",
      rawValue: record.isDormantReactivated
        ? `Reactivated (${record.dormancyDays}d silent)`
        : `Age: ${record.terminalAccountAgeDays}d`,
      normalizedScore: dormancyNorm,
      weightPercent: 25,
      weightedPoints: Math.round(dormancyWeighted * 10) / 10,
      description: "Sudden spike in credits on long-dormant or newly opened mule sinks."
    },
    {
      signalName: "Hotspot Proximity Index",
      category: "spatial",
      rawValue: `${(record.proximityToHistoricalHotspotKm * 1000).toFixed(0)}m to cluster`,
      normalizedScore: proximityNorm,
      weightPercent: 20,
      weightedPoints: Math.round(proximityWeighted * 10) / 10,
      description: "Geodesic distance from terminal KYC anchor to historical cashout ATM."
    },
    {
      signalName: "Chain Depth & Volume",
      category: "structural",
      rawValue: `${record.hopsCount} hops | ₹${(record.stolenAmount / 1000).toFixed(0)}k`,
      normalizedScore: structuralNorm,
      weightPercent: 20,
      weightedPoints: Math.round(structuralWeighted * 10) / 10,
      description: "Complexity of transaction hops and total stolen capital volume."
    }
  ];

  return {
    recordId: record.id,
    compositeScore,
    threatLevel,
    breakdown,
    urgencyWindowMinutes,
    advisoryRecommendation,
    assessedAt: new Date().toISOString()
  };
}
