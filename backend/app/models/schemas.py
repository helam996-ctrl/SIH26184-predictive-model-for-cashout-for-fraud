from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class FraudComplaintPayload(BaseModel):
    incident_id: str = Field(..., description="Unique incident identifier e.g., NCRP-2026-88192")
    source_account: str = Field(..., min_length=6, description="Victim debit bank account")
    victim_name: str = Field(..., description="Name of the reporting victim")
    victim_phone: str = Field(..., description="10-digit mobile number")
    utr: str = Field(..., min_length=8, description="Initial Unique Transaction Reference")
    amount: float = Field(..., gt=0, description="Fraudulent transferred amount in INR")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of fraudulent transaction")
    channel: str = Field(default="UPI", description="Payment rail: UPI, IMPS, NEFT, RTGS")
    reporting_agency: str = Field(default="1930 / I4C CFCFRMS", description="Originating reporting portal")
    source_ifsc: Optional[str] = Field(None, description="Victim bank branch IFSC")

class TransactionHop(BaseModel):
    hop_id: str
    from_account: str
    to_account: str
    from_bank_ifsc: str
    to_bank_ifsc: str
    amount: float
    utr: str
    timestamp: datetime
    hop_level: int = Field(..., ge=1, le=5, description="1=Layer 1, 2=Layer 2, 3=Terminal Mule")
    channel: str = "IMPS"

class MuleTraceResult(BaseModel):
    incident_id: str
    total_stolen_amount: float
    hops_count: int
    chain: List[TransactionHop]
    terminal_account: str
    terminal_holder_name: str
    terminal_bank: str
    terminal_ifsc: str
    kyc_branch_name: str
    kyc_latitude: float
    kyc_longitude: float
    mule_account_age_days: int
    is_dormant_reactivated: bool
    transfer_velocity_inr_per_min: float
    time_delta_minutes: float

class ATMNode(BaseModel):
    atm_id: str
    bank_name: str
    operator: str
    latitude: float
    longitude: float
    address: str
    distance_km: float
    crime_density_score: float = Field(..., ge=0.0, le=1.0, description="Historical spatial crime density")
    cash_out_probability: float = Field(default=0.0, ge=0.0, le=1.0)
    risk_rank: int = 1
    last_withdrawal_time: Optional[datetime] = None
    osm_id: Optional[int] = None
    vault_capacity_inr: float = 3000000.0
    current_vault_balance_inr: float = 1200000.0
    rbi_single_limit_inr: float = 20000.0
    vault_exhaustion_risk: bool = False
    required_swipes: int = 1

class ATMClusterResult(BaseModel):
    center_lat: float
    center_lon: float
    buffer_radius_km: float
    candidate_atms: List[ATMNode]
    top_interdiction_atm: Optional[ATMNode]

class MLRiskScore(BaseModel):
    random_forest_prob: float = Field(..., ge=0.0, le=1.0)
    adtk_anomaly_flag: bool
    volatility_shift_magnitude: float
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    threat_level: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    operational_window_minutes: int
    feature_importances: Dict[str, float]
    time_series_anomalies: Optional[List[str]] = Field(default_factory=list)
    forecasted_cashout_trajectory: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    time_series_model: Optional[str] = "NeuralNine ADTK & Autoregressive Forecaster"

class IncidentSummaryResponse(BaseModel):
    incident_id: str
    executive_brief: str
    risk_factors: List[str]
    interdiction_recommendation: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class LegalHoldDraft(BaseModel):
    notice_id: str
    statutory_authority: str = "Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Form 91"
    bank_name: str
    nodal_officer_email: str
    terminal_account: str
    terminal_holder: str
    frozen_amount: float
    utr_chain: List[str]
    issuing_lea_unit: str = "Cyber Crime Investigation Unit, State Police / I4C"
    compliance_deadline_mins: int = 15
    draft_body: str

class DispatchActionRequest(BaseModel):
    incident_id: str
    target_atm_id: str
    bank_nodal_email: Optional[str] = "nodal.cyber@bank-network.in"
    patrol_unit_phone: Optional[str] = "+919876543210"
    patrol_unit_id: Optional[str] = "PCR-ALPHA-402"
    officer_notes: Optional[str] = "Immediate physical interdiction required"

class DispatchResult(BaseModel):
    dispatch_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    bank_email_status: str
    patrol_sms_status: str
    resend_id: Optional[str] = None
    fast2sms_id: Optional[str] = None
    audit_trail: Dict[str, Any]
