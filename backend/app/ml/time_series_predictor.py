"""
CyberSuraksha Time-Series Cash-Out Trajectory Predictor
Adapted from NeuralNine's Time Series Prediction architecture
(using lag feature transformations, windowed regression, and projected cash-out density curves).
"""

from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

class CashOutTimeSeriesForecaster:
    """
    Autoregressive time-series predictor that projects the upcoming ATM cash-out
    culmination window based on historical transfer acceleration and sequential lag windows.
    """
    def __init__(self, lag_steps: int = 3):
        self.lag_steps = lag_steps
        self.model = Ridge(alpha=1.0)
        self._is_trained = False
        self._initialize_baseline_model()

    def create_lag_features(self, series: np.ndarray, lags: int = 3) -> Tuple[np.ndarray, np.ndarray]:
        """
        Transforms a 1D time-series into a supervised learning problem using sliding lag windows:
        X = [y_{t-lag}, ..., y_{t-1}], Y = y_t
        """
        X, Y = [], []
        for i in range(lags, len(series)):
            X.append(series[i - lags:i])
            Y.append(series[i])
        return np.array(X), np.array(Y)

    def _initialize_baseline_model(self):
        """Pre-fits autoregressive model on synthetic laundering acceleration profiles."""
        # Baseline training curve representing typical mule account velocity transitions
        base_series = np.array([
            500.0, 600.0, 750.0, 800.0, 1100.0, 1400.0,
            2500.0, 4800.0, 9200.0, 17500.0, 31000.0, 48000.0
        ])
        X, Y = self.create_lag_features(base_series, self.lag_steps)
        self.model.fit(X, Y)
        self._is_trained = True

    def forecast_trajectory(
        self,
        current_velocity: float,
        time_delta_mins: float,
        hops_count: int,
        steps_ahead: int = 6
    ) -> Dict[str, Any]:
        """
        Predicts future cash-out probabilities and transfer pressure over a 90-minute operational horizon.
        Generates interval points: T+10m, T+20m, T+30m, T+45m, T+60m, T+90m.
        """
        # Create sequence of prior velocity observations
        history = [
            max(100.0, current_velocity * 0.15),
            max(200.0, current_velocity * 0.45),
            current_velocity
        ]

        projected_velocities = []
        curr_lags = list(history[-self.lag_steps:])

        for _ in range(steps_ahead):
            feat = np.array([curr_lags[-self.lag_steps:]])
            pred_val = float(self.model.predict(feat)[0])
            # Damping factor: mule cash-out typically surges to a ceiling and plateaus
            damped_val = min(current_velocity * 2.5, max(pred_val, current_velocity * 0.9))
            projected_velocities.append(damped_val)
            curr_lags.append(damped_val)

        # Map projections to operational time points
        time_offsets = [10, 20, 30, 45, 60, 90]
        trajectory_points = []
        
        # Calculate peak cash-out risk minute based on velocity acceleration
        acceleration = (current_velocity / max(1.0, time_delta_mins))
        peak_minute = int(max(15, min(75, 90 - (acceleration / 500.0) * 15.0)))

        for i, t_offset in enumerate(time_offsets):
            # Cash-out probability bell curve peaking near peak_minute
            dist_from_peak = abs(t_offset - peak_minute)
            decay = np.exp(-0.5 * (dist_from_peak / 20.0) ** 2)
            prob = float(min(0.99, max(0.15, 0.45 + 0.50 * decay + (0.04 * hops_count))))

            trajectory_points.append({
                "minute_offset": t_offset,
                "projected_time_label": f"T+{t_offset}m",
                "predicted_withdrawal_probability": round(prob, 3),
                "projected_velocity_inr_per_min": round(projected_velocities[i], 1),
                "threat_phase": "IMMINENT_PEAK" if dist_from_peak <= 15 else ("BUILDUP" if t_offset < peak_minute else "DISPERSION")
            })

        return {
            "forecast_horizon_minutes": 90,
            "estimated_peak_cashout_minute": peak_minute,
            "trajectory": trajectory_points,
            "algorithm": "NeuralNine Autoregressive Lag Forecaster (Ridge)"
        }
