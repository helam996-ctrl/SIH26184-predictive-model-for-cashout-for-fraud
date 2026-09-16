import math
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import ATMNode, ATMClusterResult
from backend.app.data.atm_dataset import ATM_MASTER_DATABASE

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

from backend.app.core.rbi_benchmarks import RBIBenchmarkCalibrator

class GeospatialEngine:
    def __init__(self, atm_db: Optional[List[Dict[str, Any]]] = None):
        self.atm_db = atm_db or ATM_MASTER_DATABASE

    def query_atms_within_buffer(
        self,
        center_lat: float,
        center_lon: float,
        radius_km: float = 2.0,
        mule_cash_out_score: float = 0.85,
        stolen_amount: float = 250000.0
    ) -> ATMClusterResult:
        """
        Executes spatial buffer interdiction query (ST_DWithin equivalent).
        Identifies ATMs within radius_km of the KYC anchor coordinate,
        calculates distance, ranks them by combined spatial proximity and crime density,
        and evaluates ATM cash vault levels against RBI DBIE benchmarks.
        """
        candidates: List[ATMNode] = []

        for item in self.atm_db:
            dist = haversine_distance_km(center_lat, center_lon, item["latitude"], item["longitude"])
            if dist <= radius_km:
                # Proximity factor decays with distance (1.0 at center, 0.0 at radius_km)
                proximity_factor = max(0.0, 1.0 - (dist / radius_km))
                crime_weight = item["crime_density_score"]

                # Cash-out probability combines mule risk, proximity, and historical crime density
                combined_prob = (0.45 * mule_cash_out_score) + (0.35 * crime_weight) + (0.20 * proximity_factor)
                combined_prob = min(0.99, max(0.05, combined_prob))

                # RBI DBIE Vault State Calibration
                vault_cap = item.get("vault_capacity_inr", 3000000.0)
                vault_bal = item.get("current_vault_balance_inr", 1200000.0)
                rbi_eval = RBIBenchmarkCalibrator.evaluate_atm_vault_state(
                    atm_id=item["atm_id"],
                    bank_name=item["bank_name"],
                    initial_vault_balance=vault_bal,
                    vault_capacity=vault_cap,
                    incoming_cashout_amount=stolen_amount
                )

                candidates.append(
                    ATMNode(
                        atm_id=item["atm_id"],
                        bank_name=item["bank_name"],
                        operator=item["operator"],
                        latitude=item["latitude"],
                        longitude=item["longitude"],
                        address=item["address"],
                        distance_km=round(dist, 3),
                        crime_density_score=round(crime_weight, 2),
                        cash_out_probability=round(combined_prob, 3),
                        risk_rank=1,
                        osm_id=item.get("osm_id"),
                        vault_capacity_inr=vault_cap,
                        current_vault_balance_inr=rbi_eval["current_vault_balance_inr"],
                        rbi_single_limit_inr=rbi_eval["rbi_single_txn_limit_inr"],
                        vault_exhaustion_risk=rbi_eval["vault_exhaustion_risk"],
                        required_swipes=rbi_eval["required_atm_swipes"]
                    )
                )

        # Sort candidate ATMs by cash-out probability descending
        candidates.sort(key=lambda x: x.cash_out_probability, reverse=True)

        for rank, atm in enumerate(candidates, start=1):
            atm.risk_rank = rank

        top_interdiction = candidates[0] if candidates else None

        return ATMClusterResult(
            center_lat=center_lat,
            center_lon=center_lon,
            buffer_radius_km=radius_km,
            candidate_atms=candidates,
            top_interdiction_atm=top_interdiction
        )

    def generate_geojson(
        self,
        cluster_result: ATMClusterResult,
        incident_id: str,
        threshold: float = 0.70
    ) -> Dict[str, Any]:
        """
        Formats ATM nodes and spatial buffer into a standard GeoJSON FeatureCollection
        for streaming to Next.js 15 Leaflet dashboard.
        """
        features: List[Dict[str, Any]] = []

        # 1. Center KYC Branch Feature
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [cluster_result.center_lon, cluster_result.center_lat]
            },
            "properties": {
                "category": "KYC_BRANCH",
                "incident_id": incident_id,
                "title": "Terminal Mule KYC Branch",
                "radius_km": cluster_result.buffer_radius_km
            }
        })

        # 2. ATM Points
        for atm in cluster_result.candidate_atms:
            is_high_risk = atm.cash_out_probability >= threshold
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [atm.longitude, atm.latitude]
                },
                "properties": {
                    "category": "ATM",
                    "atm_id": atm.atm_id,
                    "bank_name": atm.bank_name,
                    "operator": atm.operator,
                    "address": atm.address,
                    "distance_km": atm.distance_km,
                    "crime_density": atm.crime_density_score,
                    "cash_out_probability": atm.cash_out_probability,
                    "risk_rank": atm.risk_rank,
                    "is_high_risk": is_high_risk,
                    "pin_color": "#ef4444" if is_high_risk else "#22c55e"
                }
            })

        return {
            "type": "FeatureCollection",
            "metadata": {
                "incident_id": incident_id,
                "threshold": threshold,
                "total_candidate_atms": len(cluster_result.candidate_atms),
                "high_risk_count": sum(1 for a in cluster_result.candidate_atms if a.cash_out_probability >= threshold)
            },
            "features": features
        }
