from fastapi.testclient import TestClient
from backend.main import app
from backend.app.core.graph_tracer import MuleTracer, get_preset_scenario
from backend.app.core.geospatial import GeospatialEngine
from backend.app.ml.scorer import RiskScoringEngine

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["model_cached"] is True

def test_pydantic_valid_complaint_ingestion():
    """FR-1: Validate valid JSON complaint payload"""
    payload = {
        "incident_id": "NCRP-2026-TEST01",
        "source_account": "12345678901",
        "victim_name": "Ramesh Chandra",
        "victim_phone": "9811223344",
        "utr": "UTR9988776655",
        "amount": 250000.0,
        "channel": "UPI",
        "reporting_agency": "1930 / I4C CFCFRMS"
    }
    response = client.post("/api/complaints/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACCEPTED"
    assert data["incident_id"] == "NCRP-2026-TEST01"

def test_pydantic_malformed_payload_rejected():
    """FR-1 & FR-2: Reject malformed payload with descriptive errors"""
    malformed = {
        "incident_id": "NCRP-2026-BAD",
        # missing source_account
        # negative amount
        "amount": -500.0,
        "utr": "SHORT"
    }
    response = client.post("/api/complaints/ingest", json=malformed)
    assert response.status_code == 422  # Unprocessable Entity
    detail = response.json().get("detail", [])
    assert len(detail) > 0

def test_graph_traversal_mule_resolution():
    """FR-2: Test multi-hop recursive graph traversal and terminal account resolution"""
    tracer = MuleTracer()
    inc_id, src_acct, hops = get_preset_scenario("jamtara_cashout")
    result = tracer.trace_terminal_account(inc_id, src_acct, hops)

    assert result.hops_count == 3
    assert result.terminal_account == "99401827401"
    assert result.terminal_bank == "Bank of Baroda"
    assert result.terminal_ifsc == "BARB0007890"
    assert result.kyc_latitude > 0.0 and result.kyc_longitude > 0.0
    assert result.transfer_velocity_inr_per_min > 0.0

def test_geospatial_buffer_and_clustering():
    """FR-3: Test 1-3km buffer spatial query and ATM ranking"""
    geo = GeospatialEngine()
    # Query around East Delhi Shakarpur / Laxmi Nagar
    cluster = geo.query_atms_within_buffer(
        center_lat=28.6328,
        center_lon=77.2790,
        radius_km=2.5,
        mule_cash_out_score=0.88
    )
    assert len(cluster.candidate_atms) >= 3
    assert cluster.top_interdiction_atm is not None
    # Highest ranked ATM must have highest cash-out probability
    assert cluster.candidate_atms[0].cash_out_probability >= cluster.candidate_atms[-1].cash_out_probability

def test_ml_risk_scoring_and_anomaly():
    """FR-4: Dual-model risk scoring combining Random Forest & ADTK"""
    tracer = MuleTracer()
    inc_id, src_acct, hops = get_preset_scenario("jamtara_cashout")
    mule_res = tracer.trace_terminal_account(inc_id, src_acct, hops)

    scorer = RiskScoringEngine()
    score = scorer.calculate_risk(mule_res, nearest_atm_distance_km=0.45)

    assert 0.0 <= score.random_forest_prob <= 1.0
    assert 0.0 <= score.composite_risk_score <= 100.0
    assert score.threat_level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert score.operational_window_minutes > 0
    assert len(score.feature_importances) > 0

def test_geojson_streaming_endpoint():
    """FR-5 & FR-10: Test GeoJSON streaming endpoint with dynamic threshold"""
    response = client.get("/api/threats/geojson?scenario=delhi_ncr_ring&threshold=0.75&radius_km=2.5")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    assert "metadata" in data
    assert data["metadata"]["threshold"] == 0.75

def test_ai_legal_notice_and_incident_dossier():
    """FR-6 & FR-12: Test Section 102 BNSS Form 91 legal hold drafting"""
    payload = {
        "mule_info": {
            "incident_id": "NCRP-2026-TEST02",
            "total_stolen_amount": 350000.0,
            "hops_count": 3,
            "chain": [],
            "terminal_account": "99401827401",
            "terminal_holder_name": "Vikash K. (Mule)",
            "terminal_bank": "State Bank of India",
            "terminal_ifsc": "SBIN0001234",
            "kyc_branch_name": "Laxmi Nagar Main Branch",
            "kyc_latitude": 28.6328,
            "kyc_longitude": 77.2790,
            "mule_account_age_days": 4,
            "is_dormant_reactivated": True,
            "transfer_velocity_inr_per_min": 25000.0,
            "time_delta_minutes": 14.0
        },
        "risk_score": {
            "random_forest_prob": 0.88,
            "adtk_anomaly_flag": True,
            "volatility_shift_magnitude": 2.8,
            "composite_risk_score": 89.5,
            "threat_level": "CRITICAL",
            "operational_window_minutes": 46,
            "feature_importances": {"transfer_velocity": 0.35}
        }
    }
    response = client.post("/api/ai/draft-notice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "incident_summary" in data
    assert "legal_hold_draft" in data
    draft = data["legal_hold_draft"]
    assert "SECTION 102" in draft["statutory_authority"].upper()
    assert "99401827401" in draft["draft_body"]

def test_dual_dispatch_endpoint():
    """FR-7, FR-13, FR-14: Test automated dual dispatch to bank and field units"""
    payload = {
        "incident_id": "NCRP-2026-44810",
        "target_atm_id": "ATM-DL-0881",
        "bank_nodal_email": "nodal.cyber@sbi.co.in",
        "patrol_unit_phone": "+919811002233",
        "patrol_unit_id": "PCR-ECHO-12",
        "officer_notes": "Suspect observed moving toward Shakarpur ATM cluster"
    }
    response = client.post("/api/dispatch/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "dispatch_id" in data
    assert data["bank_email_status"] in ["SENT_LIVE", "SIMULATED_SUCCESS", "FALLBACK_SANDBOX"]
    assert data["patrol_sms_status"] in ["DISPATCHED_LIVE", "SIMULATED_SUCCESS", "FALLBACK_SANDBOX"]
    assert "audit_trail" in data
