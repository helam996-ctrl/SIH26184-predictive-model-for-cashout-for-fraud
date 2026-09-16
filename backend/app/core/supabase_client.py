import os
from typing import Dict, Any, List, Optional
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
SUPABASE_ANON_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

class SupabaseBackendClient:
    """
    Direct PostgREST HTTP interface for Supabase PostgreSQL.
    Provides fast, non-blocking persistence without external heavy driver dependencies.
    """
    def __init__(self):
        self.base_url = f"{SUPABASE_URL.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": SUPABASE_SECRET_KEY,
            "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def insert_complaint(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Stores NCRP / 1930 Helpline fraud complaint in Supabase."""
        try:
            url = f"{self.base_url}/complaints"
            resp = requests.post(url, json=data, headers=self.headers, timeout=5)
            if resp.status_code in [200, 201]:
                return resp.json()[0] if resp.json() else data
            else:
                print(f"[Supabase Insert Complaint Notice]: HTTP {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            print(f"[Supabase Client Warning]: {e}")
            return None

    def insert_mule_trace(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Stores mule trajectory and spatial risk metrics in Supabase."""
        try:
            url = f"{self.base_url}/mule_traces"
            resp = requests.post(url, json=data, headers=self.headers, timeout=5)
            if resp.status_code in [200, 201]:
                return resp.json()[0] if resp.json() else data
            return None
        except Exception as e:
            print(f"[Supabase Client Warning]: {e}")
            return None

    def insert_legal_hold(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Stores statutory Section 102 BNSS legal hold notice in Supabase."""
        try:
            url = f"{self.base_url}/legal_holds"
            resp = requests.post(url, json=data, headers=self.headers, timeout=5)
            if resp.status_code in [200, 201]:
                return resp.json()[0] if resp.json() else data
            return None
        except Exception as e:
            print(f"[Supabase Client Warning]: {e}")
            return None

    def insert_dispatch_log(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Stores dispatch telemetry (Resend email / Fast2SMS SMS) in Supabase."""
        try:
            url = f"{self.base_url}/dispatch_logs"
            resp = requests.post(url, json=data, headers=self.headers, timeout=5)
            if resp.status_code in [200, 201]:
                return resp.json()[0] if resp.json() else data
            return None
        except Exception as e:
            print(f"[Supabase Client Warning]: {e}")
            return None

supabase_backend = SupabaseBackendClient()
