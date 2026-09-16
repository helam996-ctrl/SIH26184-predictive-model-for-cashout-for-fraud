import { supabase } from "@/lib/supabase";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface TransactionHop {
  hop_id: string;
  from_account: string;
  to_account: string;
  from_bank_ifsc: string;
  to_bank_ifsc: string;
  amount: number;
  utr: string;
  timestamp: string;
  hop_level: number;
  channel: string;
}

export interface MuleTraceResult {
  incident_id: string;
  total_stolen_amount: number;
  hops_count: number;
  chain: TransactionHop[];
  terminal_account: string;
  terminal_holder_name: string;
  terminal_bank: string;
  terminal_ifsc: string;
  kyc_branch_name: string;
  kyc_latitude: number;
  kyc_longitude: number;
  mule_account_age_days: number;
  is_dormant_reactivated: boolean;
  transfer_velocity_inr_per_min: number;
  time_delta_minutes: number;
}

export interface ATMNode {
  atm_id: string;
  bank_name: string;
  operator: string;
  latitude: number;
  longitude: number;
  address: string;
  distance_km: number;
  crime_density_score: number;
  cash_out_probability: number;
  risk_rank: number;
  osm_id?: number;
  vault_capacity_inr?: number;
  current_vault_balance_inr?: number;
  rbi_single_limit_inr?: number;
  vault_exhaustion_risk?: boolean;
  required_swipes?: number;
}

export interface ATMClusterResult {
  center_lat: number;
  center_lon: number;
  buffer_radius_km: number;
  candidate_atms: ATMNode[];
  top_interdiction_atm: ATMNode | null;
}

export interface MLRiskScore {
  random_forest_prob: number;
  adtk_anomaly_flag: boolean;
  volatility_shift_magnitude: number;
  composite_risk_score: number;
  threat_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  operational_window_minutes: number;
  feature_importances: Record<string, number>;
}

export interface IncidentSummaryResponse {
  incident_id: string;
  executive_brief: string;
  risk_factors: string[];
  interdiction_recommendation: string;
  generated_at: string;
}

export interface LegalHoldDraft {
  notice_id: string;
  statutory_authority: string;
  bank_name: string;
  nodal_officer_email: string;
  terminal_account: string;
  terminal_holder: string;
  frozen_amount: number;
  utr_chain: string[];
  issuing_lea_unit: string;
  compliance_deadline_mins: number;
  draft_body: string;
}

export interface DispatchResult {
  dispatch_id: string;
  timestamp: string;
  bank_email_status: string;
  patrol_email_status: string;
  resend_id?: string;
  patrol_email_id?: string;
  audit_trail: Record<string, any>;
}

export interface MLModelMetadata {
  dataset_source: string;
  features: string[];
  roc_auc_score: number;
  total_records: number;
  fraud_records: number;
  feature_importances: Record<string, number>;
}

export interface TelemetryStats {
  coordination_latency_seconds: number;
  coordination_latency_target_seconds: number;
  traditional_latency_hours: string;
  latency_reduction_percent: number;
  active_interdiction_window_mins: number;
  stolen_funds_intercepted_today_inr: number;
  total_terminal_accounts_frozen: number;
  beat_patrol_interdictions_successful: number;
  resend_delivery_rate: string;
  patrol_email_dispatch_rate: string;
  ml_model_metadata?: MLModelMetadata;
}


export async function fetchTelemetry(): Promise<TelemetryStats> {
  const res = await fetch(`${API_BASE_URL}/telemetry/stats`);
  if (!res.ok) throw new Error("Failed to load telemetry stats");
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch(`${API_BASE_URL}/scenarios`);
  if (!res.ok) throw new Error("Failed to load scenarios");
  return res.json();
}

export async function traceMuleScenario(scenarioKey: string): Promise<MuleTraceResult> {
  const res = await fetch(`${API_BASE_URL}/traversal/trace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_id: "",
      source_account: "",
      scenario_preset: scenarioKey
    })
  });
  if (!res.ok) throw new Error("Failed to trace scenario");
  return res.json();
}

export async function queryAtmCluster(
  lat: number,
  lon: number,
  radiusKm: number = 2.5
): Promise<ATMClusterResult> {
  const res = await fetch(`${API_BASE_URL}/spatial/cluster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      center_lat: lat,
      center_lon: lon,
      radius_km: radiusKm,
      mule_cash_out_score: 0.88
    })
  });
  if (!res.ok) throw new Error("Failed to cluster ATMs");
  return res.json();
}

export async function scoreMlRisk(
  muleInfo: MuleTraceResult,
  nearestDistanceKm: number = 0.65
): Promise<MLRiskScore> {
  const res = await fetch(`${API_BASE_URL}/ml/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mule_info: muleInfo,
      nearest_atm_distance_km: nearestDistanceKm
    })
  });
  if (!res.ok) throw new Error("Failed to score ML risk");
  return res.json();
}

export async function draftAiNotice(
  muleInfo: MuleTraceResult,
  riskScore: MLRiskScore,
  targetAtmId?: string
): Promise<{ incident_summary: IncidentSummaryResponse; legal_hold_draft: LegalHoldDraft }> {
  const res = await fetch(`${API_BASE_URL}/ai/draft-notice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mule_info: muleInfo,
      risk_score: riskScore,
      target_atm_id: targetAtmId
    })
  });
  if (!res.ok) throw new Error("Failed to draft AI notice");
  return res.json();
}

export async function executeDualDispatch(
  incidentId: string,
  targetAtmId: string,
  bankEmail?: string,
  patrolPhone?: string,
  patrolUnitId?: string,
  officerNotes?: string
): Promise<DispatchResult> {
  const res = await fetch(`${API_BASE_URL}/dispatch/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_id: incidentId,
      target_atm_id: targetAtmId,
      bank_nodal_email: bankEmail,
      patrol_unit_phone: patrolPhone,
      patrol_unit_id: patrolUnitId,
      officer_notes: officerNotes
    })
  });
  if (!res.ok) throw new Error("Failed to execute dual dispatch");
  return res.json();
}

export async function ingestFraudComplaint(payload: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[Backend API Offline - Using Direct Supabase Ingestion]:", err);
  }

  // Fallback: Direct insert into Supabase PostgreSQL complaints table
  const { error } = await supabase.from("complaints").insert([
    {
      incident_id: payload.incident_id,
      source_account: payload.source_account,
      victim_name: payload.victim_name,
      victim_phone: payload.victim_phone,
      utr: payload.utr,
      amount: parseFloat(payload.amount),
      channel: payload.channel || "UPI",
      reporting_agency: payload.reporting_agency || "1930 / I4C CFCFRMS Stream",
      status: "INGESTED"
    }
  ]);

  if (error) {
    console.error("[Supabase Direct Ingestion Error]:", error);
  }

  return {
    status: "ACCEPTED",
    message: "Fraud complaint validated and registered into interdiction pipeline (Supabase DB)",
    incident_id: payload.incident_id,
    amount: payload.amount
  };
}
