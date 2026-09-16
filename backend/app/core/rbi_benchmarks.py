from typing import Dict, Any, Tuple

# Reserve Bank of India (RBI) DBIE Payment System Indicators
# Derived from official "Bankwise ATM/POS/Card Statistics"
RBI_ATM_STANDARDS = {
    "NON_HOME_BANK_SINGLE_TXN_LIMIT_INR": 10000.0,
    "HOME_BANK_SINGLE_TXN_LIMIT_INR": 20000.0,
    "DAILY_CARD_CASH_LIMIT_INR": 40000.0,
    "TYPICAL_ON_SITE_VAULT_INR": 3500000.0,
    "TYPICAL_OFF_SITE_VAULT_INR": 2500000.0,
    "AVG_DAILY_ATM_DISPENSE_INR": 450000.0,
    "LOW_VAULT_ALERT_THRESHOLD_INR": 250000.0,
    "DISPENSE_TIME_PER_TXN_SECONDS": 45.0  # Time required for physical card insertion, PIN, note counting & dispensing
}

class RBIBenchmarkCalibrator:
    """
    Calibrates physical ATM node states, cash vault levels, and dispenser velocity
    against official Reserve Bank of India (RBI) DBIE benchmark limits.
    """
    @staticmethod
    def evaluate_atm_vault_state(
        atm_id: str,
        bank_name: str,
        initial_vault_balance: float,
        vault_capacity: float,
        incoming_cashout_amount: float
    ) -> Dict[str, Any]:
        """
        Evaluates physical ATM dispenser dynamics when an illicit cash-out occurs:
        - Estimates number of card transactions required under RBI single-swipe limits
        - Calculates physical time needed by mule at the ATM (operational interdiction window)
        - Checks whether the cash-out will trigger vault exhaustion
        """
        is_home_bank = "State Bank" in bank_name or "SBI" in bank_name or "HDFC" in bank_name
        single_txn_limit = (
            RBI_ATM_STANDARDS["HOME_BANK_SINGLE_TXN_LIMIT_INR"]
            if is_home_bank
            else RBI_ATM_STANDARDS["NON_HOME_BANK_SINGLE_TXN_LIMIT_INR"]
        )

        # Number of physical ATM swipes required to drain the illicit funds
        required_swipes = int(-(-incoming_cashout_amount // single_txn_limit))  # ceiling division
        
        # Physical dwell time at ATM (seconds & minutes): card insert, PIN, cash count, dispense
        physical_dwell_seconds = required_swipes * RBI_ATM_STANDARDS["DISPENSE_TIME_PER_TXN_SECONDS"]
        physical_dwell_minutes = round(physical_dwell_seconds / 60.0, 1)

        # Vault depletion
        remaining_balance = max(0.0, initial_vault_balance - incoming_cashout_amount)
        depletion_ratio = round((incoming_cashout_amount / max(1.0, initial_vault_balance)) * 100.0, 1)

        is_vault_exhausted = remaining_balance < RBI_ATM_STANDARDS["LOW_VAULT_ALERT_THRESHOLD_INR"]
        multiple_swipes_mandate = required_swipes > 1

        return {
            "atm_id": atm_id,
            "bank_name": bank_name,
            "rbi_single_txn_limit_inr": single_txn_limit,
            "rbi_daily_card_limit_inr": RBI_ATM_STANDARDS["DAILY_CARD_CASH_LIMIT_INR"],
            "vault_capacity_inr": vault_capacity,
            "current_vault_balance_inr": remaining_balance,
            "depletion_percentage": min(100.0, depletion_ratio),
            "required_atm_swipes": required_swipes,
            "physical_dwell_time_minutes": physical_dwell_minutes,
            "vault_exhaustion_risk": is_vault_exhausted,
            "mule_cluster_dwell_alert": multiple_swipes_mandate,
            "rbi_benchmark_compliance": "RBI DBIE Payment System Indicators 2026"
        }
