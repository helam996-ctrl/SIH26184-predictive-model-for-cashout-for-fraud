import pytest
from backend.app.core.kyc_geolocator import KYCGeolocator
from backend.app.core.overpass_client import OverpassATMClient
from backend.app.core.rbi_benchmarks import RBIBenchmarkCalibrator
from backend.app.ml.scorer import RiskScoringEngine
from backend.app.core.graph_tracer import get_preset_scenario, MuleTracer

def test_paysim_feature_scorer():
    """Verify that PaySim features are extracted and produce a valid risk score"""
    tracer = MuleTracer()
    inc_id, src_acct, hops = get_preset_scenario("jaipur_mule_ring")
    mule = tracer.trace_terminal_account(inc_id, src_acct, hops)

    scorer = RiskScoringEngine()
    score = scorer.calculate_risk(mule, nearest_atm_distance_km=0.35)

    assert 0.0 <= score.random_forest_prob <= 1.0
    assert 0.0 <= score.composite_risk_score <= 100.0
    assert score.threat_level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

def test_razorpay_ifsc_geolocator():
    """Verify Razorpay IFSC lookup resolves official bank, address, city, state, and attached coordinates"""
    geo = KYCGeolocator()
    # Test 1: South Delhi Hub (SBI Malviya Nagar)
    delhi_info = geo.resolve_branch_coordinates("SBIN0001493")
    assert delhi_info["ifsc"] == "SBIN0001493"
    assert "State Bank of India" in delhi_info["bank"]
    assert "MALVIYA NAGAR" in delhi_info["branch"].upper()
    assert "DELHI" in delhi_info["state"].upper()
    assert abs(delhi_info["lat"] - 28.5368) < 0.1
    assert abs(delhi_info["lon"] - 77.2107) < 0.1
    assert delhi_info["source"] in ["RAZORPAY_IFSC_API_LIVE", "INTERNAL_KYC_CACHE"]

    # Test 2: Mumbai Hub (HDFC Nariman Point)
    mumbai_info = geo.resolve_branch_coordinates("HDFC0000001")
    assert mumbai_info["ifsc"] == "HDFC0000001"
    assert "HDFC" in mumbai_info["bank"]
    assert "MAHARASHTRA" in mumbai_info["state"].upper()
    assert abs(mumbai_info["lat"] - 18.926) < 0.2
    assert abs(mumbai_info["lon"] - 72.823) < 0.2

    # Test 3: Jaipur Main branch
    jaipur_info = geo.resolve_branch_coordinates("SBIN0000656")
    assert jaipur_info["ifsc"] == "SBIN0000656"
    assert "State Bank" in jaipur_info["bank"]
    assert "RAJASTHAN" in jaipur_info["state"].upper()
    assert jaipur_info["lat"] > 0 and jaipur_info["lon"] > 0

def test_overpass_atm_client():
    """Verify Overpass QL query construction and node parsing"""
    client = OverpassATMClient()
    bbox = (26.85, 75.75, 26.95, 75.85)  # Jaipur bbox
    query = client.build_query(bbox)
    assert 'node["amenity"="atm"]' in query
    assert 'node["amenity"="bank"]["atm"="yes"]' in query

    mock_overpass = {
        "elements": [
            {
                "type": "node",
                "id": 1001,
                "lat": 26.9185,
                "lon": 75.8142,
                "tags": {
                    "amenity": "atm",
                    "operator": "Hitachi",
                    "brand": "State Bank of India",
                    "addr:street": "MI Road"
                }
            }
        ]
    }
    parsed = client.parse_overpass_nodes(mock_overpass, "Jaipur")
    assert len(parsed) == 1
    assert parsed[0]["atm_id"] == "OSM-ATM-1001"
    assert parsed[0]["bank_name"] == "Hitachi"
    assert parsed[0]["latitude"] == 26.9185

def test_rbi_benchmark_calibrator():
    """Verify RBI DBIE vault state and swipe limits evaluation"""
    eval_res = RBIBenchmarkCalibrator.evaluate_atm_vault_state(
        atm_id="ATM-RJ-4001",
        bank_name="State Bank of India",
        initial_vault_balance=950000.0,
        vault_capacity=3500000.0,
        incoming_cashout_amount=290000.0
    )
    assert eval_res["rbi_single_txn_limit_inr"] == 20000.0
    assert eval_res["required_atm_swipes"] == 15  # 290k / 20k ceil = 15
    assert eval_res["physical_dwell_time_minutes"] > 0
    assert eval_res["current_vault_balance_inr"] == 660000.0

def test_neuralnine_time_series_anomaly_ensemble():
    """Verify NeuralNine ADTK ensemble detects threshold, quantile, and persist anomalies"""
    from backend.app.ml.time_series_anomaly import TimeSeriesAnomalyEnsemble
    detector = TimeSeriesAnomalyEnsemble()
    
    # Benign stream -> should not trigger major anomalies
    benign_stream = [1100.0, 1200.0, 1300.0, 1150.0, 1250.0, 1350.0, 1200.0, 1400.0]
    benign_rep = detector.analyze_stream(benign_stream)
    assert not benign_rep["is_anomalous"]

    # Massive laundering velocity surge (jumping to 45,000 INR/min)
    surge_stream = [1100.0, 1200.0, 1300.0, 1150.0, 5000.0, 18000.0, 45000.0]
    surge_rep = detector.analyze_stream(surge_stream)
    assert surge_rep["is_anomalous"]
    assert "THRESHOLD_VELOCITY_BREACH" in surge_rep["detected_anomalies"]
    assert surge_rep["anomaly_score"] > 0.3

def test_neuralnine_time_series_forecaster():
    """Verify NeuralNine lag-based autoregressive trajectory forecaster"""
    from backend.app.ml.time_series_predictor import CashOutTimeSeriesForecaster
    forecaster = CashOutTimeSeriesForecaster(lag_steps=3)
    
    res = forecaster.forecast_trajectory(
        current_velocity=35000.0,
        time_delta_mins=15.0,
        hops_count=3,
        steps_ahead=6
    )
    assert res["forecast_horizon_minutes"] == 90
    assert len(res["trajectory"]) == 6
    assert "T+10m" in [p["projected_time_label"] for p in res["trajectory"]]
    # Verify probability bounds
    for p in res["trajectory"]:
        assert 0.0 <= p["predicted_withdrawal_probability"] <= 1.0
        assert p["threat_phase"] in ["IMMINENT_PEAK", "BUILDUP", "DISPERSION"]

