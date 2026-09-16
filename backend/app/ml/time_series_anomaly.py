"""
CyberSuraksha Time-Series Anomaly Detection Engine
Adapted from NeuralNine's Anomaly Detection Time Series Data architecture
(using ADTK: ThresholdAD, QuantileAD, InterQuartileRangeAD, PersistAD, VolatilityShiftAD).
"""

from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np
from adtk.data import validate_series
from adtk.detector import (
    ThresholdAD,
    QuantileAD,
    InterQuartileRangeAD,
    PersistAD,
    VolatilityShiftAD
)

class TimeSeriesAnomalyEnsemble:
    """
    Ensemble time-series anomaly detector for financial layering streams.
    Detects sudden transfer velocity surges, dormant account reactivation bursts,
    and variance shifts across multi-hop transaction graphs.
    """
    def __init__(self):
        # 1. Threshold Anomaly Detector: Defines statutory upper bound for normal retail transfer velocity (INR 20,000/min)
        self.threshold_ad = ThresholdAD(high=20000.0, low=0.0)

        # 2. Quantile Anomaly Detector: Flags top 95th percentile velocity spikes relative to historical series
        self.quantile_ad = QuantileAD(high=0.95, low=0.0)

        # 3. Inter-Quartile Range (IQR) Detector: Robust outlier detection (Q3 + 1.5 * IQR)
        self.iqr_ad = InterQuartileRangeAD(c=1.5)

        # 4. Persist Anomaly Detector: Flags sharp step-changes / sudden inter-hop acceleration
        self.persist_ad = PersistAD(c=2.5, side="positive", window=2)

        # 5. Volatility Shift Detector: Flags regime shifts in transaction variance
        self.volatility_ad = VolatilityShiftAD(c=2.0, side="positive", window=3)

    def prepare_series(self, velocity_sequence: List[float], baseline_mean: float = 1200.0) -> pd.Series:
        """
        Converts a raw velocity sequence into a valid DatetimeIndex time series.
        Pads with benign baseline history if fewer than 8 observations are provided.
        """
        if len(velocity_sequence) < 8:
            # Synthetic pre-incident baseline for comparison
            pre_incident = [
                baseline_mean * (1.0 + 0.1 * np.sin(i))
                for i in range(8 - len(velocity_sequence))
            ]
            full_values = pre_incident + list(velocity_sequence)
        else:
            full_values = list(velocity_sequence)

        # Ensure float dtype
        clean_values = [float(v) for v in full_values]

        # Construct time index ending at current minute
        idx = pd.date_range(end=pd.Timestamp.now(), periods=len(clean_values), freq="1min")
        ts = pd.Series(clean_values, index=idx)
        return validate_series(ts)

    def analyze_stream(self, velocity_sequence: List[float]) -> Dict[str, Any]:
        """
        Executes all 5 NeuralNine ADTK detectors on the time-series stream.
        Returns aggregate anomaly score, flags, and diagnostic breakdown.
        """
        ts = self.prepare_series(velocity_sequence)
        flags: List[str] = []
        detector_results: Dict[str, bool] = {}

        # 1. Threshold Anomaly Detection
        try:
            anom_thresh = self.threshold_ad.detect(ts)
            has_thresh = bool(anom_thresh.iloc[-1]) if not pd.isna(anom_thresh.iloc[-1]) else False
            detector_results["threshold_breach"] = has_thresh
            if has_thresh:
                flags.append("THRESHOLD_VELOCITY_BREACH")
        except Exception:
            detector_results["threshold_breach"] = ts.iloc[-1] > 20000.0
            if detector_results["threshold_breach"]:
                flags.append("THRESHOLD_VELOCITY_BREACH")

        # 2. Quantile Anomaly Detection
        try:
            anom_quant = self.quantile_ad.fit_detect(ts)
            has_quant = bool(anom_quant.iloc[-1]) if not pd.isna(anom_quant.iloc[-1]) else False
            detector_results["quantile_outlier"] = has_quant
            if has_quant:
                flags.append("QUANTILE_95_BURST")
        except Exception:
            detector_results["quantile_outlier"] = False

        # 3. Inter-Quartile Range (IQR) Anomaly Detection
        try:
            anom_iqr = self.iqr_ad.fit_detect(ts)
            has_iqr = bool(anom_iqr.iloc[-1]) if not pd.isna(anom_iqr.iloc[-1]) else False
            detector_results["iqr_outlier"] = has_iqr
            if has_iqr:
                flags.append("IQR_STATISTICAL_OUTLIER")
        except Exception:
            detector_results["iqr_outlier"] = False

        # 4. Persist Step-Change Detection
        try:
            anom_persist = self.persist_ad.fit_detect(ts)
            has_persist = bool(anom_persist.iloc[-1]) if not pd.isna(anom_persist.iloc[-1]) else False
            detector_results["persist_step_change"] = has_persist
            if has_persist:
                flags.append("PERSIST_STEP_ACCELERATION")
        except Exception:
            detector_results["persist_step_change"] = False

        # 5. Volatility Shift Detection
        try:
            anom_vol = self.volatility_ad.fit_detect(ts)
            has_vol = bool(anom_vol.iloc[-1]) if not pd.isna(anom_vol.iloc[-1]) else False
            detector_results["volatility_shift"] = has_vol
            if has_vol:
                flags.append("VOLATILITY_REGIME_SHIFT")
        except Exception:
            detector_results["volatility_shift"] = False

        # Calculate Volatility Ratio
        rolling_std = ts.tail(3).std()
        overall_std = ts.std()
        vol_ratio = float(rolling_std / overall_std) if overall_std > 0 else 1.0

        # Anomaly Score (weighted consensus among active detectors)
        positive_detections = sum(1 for v in detector_results.values() if v)
        consensus_score = positive_detections / max(1, len(detector_results))
        composite_anomaly_score = round(min(1.0, consensus_score * 0.7 + (min(3.0, vol_ratio) / 3.0) * 0.3), 3)

        terminal_val = float(ts.iloc[-1])
        is_anomalous = (
            detector_results.get("threshold_breach", False) or
            (positive_detections >= 2 and (vol_ratio > 1.5 or terminal_val > 5000.0)) or
            (positive_detections >= 1 and terminal_val > 15000.0)
        )

        return {
            "is_anomalous": is_anomalous,
            "anomaly_score": composite_anomaly_score if is_anomalous else 0.05,
            "detected_anomalies": flags if is_anomalous else [],
            "detectors_triggered": positive_detections if is_anomalous else 0,
            "volatility_ratio": round(vol_ratio, 2),
            "detector_breakdown": detector_results,
            "model_family": "NeuralNine ADTK Ensemble"
        }

