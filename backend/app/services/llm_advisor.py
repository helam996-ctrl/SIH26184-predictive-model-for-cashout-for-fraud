import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from backend.app.models.schemas import MuleTraceResult, MLRiskScore, ATMNode, IncidentSummaryResponse, LegalHoldDraft

# Configure Gemini if GEMINI_API_KEY is available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"[Gemini Config Warning]: {e}")

class LLMAdvisorService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model_name = "gemini-3.6-flash" if self.api_key else None

    def generate_incident_dossier(
        self,
        incident_id: str,
        mule_info: MuleTraceResult,
        risk_score: MLRiskScore,
        target_atm: Optional[ATMNode] = None
    ) -> IncidentSummaryResponse:
        """
        Uses Gemini 2.5 Flash (or deterministic forensic generator) to produce
        an executive incident brief and risk factor assessment.
        """
        atm_name = target_atm.bank_name if target_atm else "Unspecified ATM Cluster"
        atm_dist = f"{target_atm.distance_km} km" if target_atm else "N/A"
        atm_crime = f"{target_atm.crime_density_score * 100:.0f}%" if target_atm else "N/A"

        if self.api_key:
            try:
                model = genai.GenerativeModel("gemini-3.6-flash")
                prompt = f"""
                You are a senior cybercrime intelligence analyst at the Indian Cyber Crime Coordination Centre (I4C).
                Analyze this real-time financial cyber fraud interdiction alert:
                - Incident ID: {incident_id}
                - Stolen Amount: INR {mule_info.total_stolen_amount:,.2f}
                - Multi-Hop Traversal: {mule_info.hops_count} hops leading to Terminal Mule Account {mule_info.terminal_account} ({mule_info.terminal_holder_name})
                - Terminal KYC Branch: {mule_info.kyc_branch_name} ({mule_info.terminal_ifsc})
                - Transfer Velocity: INR {mule_info.transfer_velocity_inr_per_min:,.2f}/min across {mule_info.time_delta_minutes} mins
                - Dormant Account Reactivation: {mule_info.is_dormant_reactivated}
                - Composite Cash-Out Risk Score: {risk_score.composite_risk_score}% ({risk_score.threat_level})
                - Target ATM: {atm_name} at distance {atm_dist} (Crime Density: {atm_crime})
                - Actionable Interdiction Window: {risk_score.operational_window_minutes} minutes

                Provide:
                1. Executive Forensic Brief (2-3 crisp sentences).
                2. 3 Bulleted Risk Factors.
                3. Tactical LEA / Bank Interdiction Directive.
                """
                response = model.generate_content(prompt)
                raw_text = response.text.strip()
                # Simple extraction
                brief = raw_text.split("\n\n")[0] if "\n\n" in raw_text else raw_text[:300]
                return IncidentSummaryResponse(
                    incident_id=incident_id,
                    executive_brief=brief,
                    risk_factors=[
                        f"Abnormal transfer velocity of INR {mule_info.transfer_velocity_inr_per_min:,.0f}/min indicates automated mule layering.",
                        f"Terminal mule account {mule_info.terminal_account} registered dormant before sudden activation.",
                        f"Target ATM ({atm_name}) is situated within high-density crime zone ({atm_crime})."
                    ],
                    interdiction_recommendation=f"Immediately issue Section 102 BNSS lien on {mule_info.terminal_account} and dispatch Beat Patrol unit to {atm_name} ({atm_dist})."
                )
            except Exception as ex:
                print(f"[Gemini 2.5 Flash Fallback]: {ex}")

        # Deterministic Expert Generation (Guaranteed Offline / Benchmark Compliance)
        brief = (
            f"Automated spatial interdiction analysis for incident {incident_id} reveals an imminent "
            f"physical cash-out threat within a {risk_score.operational_window_minutes}-minute operational window. "
            f"Stolen capital amounting to INR {mule_info.total_stolen_amount:,.2f} has been routed through {mule_info.hops_count} "
            f"intermediary laundering hops into dormant mule account {mule_info.terminal_account} ({mule_info.terminal_holder_name}) "
            f"at {mule_info.kyc_branch_name}. Spatial clustering isolates candidate ATM {atm_name} ({atm_dist}) as the primary dispensing node."
        )

        risk_factors = [
            f"Extreme Layering Velocity: INR {mule_info.transfer_velocity_inr_per_min:,.0f}/min traversed across {mule_info.hops_count} banking institutions.",
            f"Dormant Account Weaponization: Mule account {mule_info.terminal_account} exhibited sudden multi-lakh influx following extended dormancy.",
            f"Geospatial Convergence: Physical ATM node {atm_name} lies within {atm_dist} of the KYC anchor with historical crime density rating of {atm_crime}."
        ]

        recommendation = (
            f"Authorize immediate automated dual dispatch: (1) Issue Section 102 BNSS statutory lien notice to "
            f"Bank Nodal Officer at {mule_info.terminal_bank}, and (2) Transmit GPS coordinate dispatch to field PCR patrol units."
        )

        return IncidentSummaryResponse(
            incident_id=incident_id,
            executive_brief=brief,
            risk_factors=risk_factors,
            interdiction_recommendation=recommendation
        )

    def draft_section_102_bnss_notice(
        self,
        incident_id: str,
        mule_info: MuleTraceResult,
        nodal_email: str = "nodal.cyber@bank-network.in",
        issuing_officer: str = "Cyber Crime Investigation Unit, State Police / I4C"
    ) -> LegalHoldDraft:
        """
        Drafts statutory legal hold notice under Section 102 of the
        Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 (Form 91 compliant).
        """
        notice_id = f"LEGAL/BNSS-102/{datetime.utcnow().year}/{incident_id.replace('NCRP-', '')}"
        utrs = [h.utr for h in mule_info.chain] or ["UTR-NOT-PROVIDED"]

        body = f"""FORM 91 / STATUTORY NOTICE UNDER SECTION 102
BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(Power of Police Officer to Seize Certain Property / Debit Freeze Order)

Ref Notice No: {notice_id}
Date & Time of Issue: {datetime.utcnow().strftime('%d-%b-%Y %H:%M:%S UTC')}
Issuing Authority: {issuing_officer}
To: The Bank Nodal Officer, Cyber Crime Cell
Bank: {mule_info.terminal_bank}
Branch: {mule_info.kyc_branch_name} (IFSC: {mule_info.terminal_ifsc})
Email: {nodal_email}

SUBJECT: MANDATORY URGENT DEBIT FREEZE / LIEN MARKING UNDER SECTION 102 BNSS (CORRESPONDING TO SEC 102 CrPC) ON ACCOUNT NO. {mule_info.terminal_account}

WHEREAS, credible intelligence and telemetry ingested through the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / National Cyber Crime Reporting Portal - 1930) under Incident ID [{incident_id}] confirms that proceeds of cyber fraud totaling INR {mule_info.total_stolen_amount:,.2f} have been illicitly transferred and credited into the following account maintained with your bank:

1. Account Number: {mule_info.terminal_account}
2. Account Holder Name: {mule_info.terminal_holder_name}
3. Bank / Branch / IFSC: {mule_info.terminal_bank} / {mule_info.kyc_branch_name} / {mule_info.terminal_ifsc}
4. Amount to be Frozen / Lien Marked: INR {mule_info.total_stolen_amount:,.2f}
5. Associated UTR Chain: {', '.join(utrs)}

NOW THEREFORE, in exercise of the powers conferred under Section 102 of the Bharatiya Nagarik Suraksha Sanhita, 2023, you are hereby directed to:

1. IMMEDIATELY MARK A TOTAL DEBIT FREEZE / LIEN on Account No. {mule_info.terminal_account} to the extent of INR {mule_info.total_stolen_amount:,.2f} with zero latency.
2. SUSPEND all debit permissions, ATM card authorizations, UPI handles, and internet banking withdrawal capabilities associated with this CIF/Account.
3. TRANSMIT within 2 hours:
   (a) Complete KYC documents (Aadhaar, PAN, registered mobile number, current photo) of {mule_info.terminal_holder_name}.
   (b) Certified Account Statement for the last 6 months.
   (c) IP logs, device identifiers, and geo-coordinates of the last 10 transactions.

FAILURE TO COMPLY:
Take notice that failure or delay in executing this statutory freeze may result in the dissipation of stolen funds via physical ATM cash dispensing, attracting penal consequences under Section 223 / Section 238 of the Bharatiya Nyaya Sanhita (BNS), 2023 for failure to assist public servants and causing disappearance of evidence.

Issued under the seal and signature of the Investigating Officer,
CyberSuraksha Proactive Interdiction Cell, I4C / State Police.
"""

        return LegalHoldDraft(
            notice_id=notice_id,
            statutory_authority="Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Form 91",
            bank_name=mule_info.terminal_bank,
            nodal_officer_email=nodal_email,
            terminal_account=mule_info.terminal_account,
            terminal_holder=mule_info.terminal_holder_name,
            frozen_amount=mule_info.total_stolen_amount,
            utr_chain=utrs,
            issuing_lea_unit=issuing_officer,
            compliance_deadline_mins=15,
            draft_body=body
        )

    def generate_atm_drawer_briefing(
        self,
        incident_id: str,
        atm_metadata: Dict[str, Any],
        mule_info: MuleTraceResult,
        operational_window_mins: int = 45
    ) -> Dict[str, Any]:
        """
        Calls Gemini 2.5 Flash to generate:
        1. Tactical Briefing: Exactly 2 sentences summarizing suspect activity and cash-out window.
        2. Legal Notice Draft: Pre-filled Section 102 BNSS account-freeze notice addressed to bank nodal officer.
        """
        atm_id = atm_metadata.get("atm_id", "ATM-NODE")
        bank_name = atm_metadata.get("bank_name", "Target ATM")
        operator = atm_metadata.get("operator", "Bank")
        dist = atm_metadata.get("distance_km", 0.5)
        raw_prob = atm_metadata.get("cash_out_probability", 0.88)
        score = raw_prob * 100 if raw_prob <= 1.0 else raw_prob

        tactical_briefing = ""
        if self.api_key:
            try:
                model = genai.GenerativeModel("gemini-3.6-flash")
                prompt = f"""
                You are a senior cybercrime intelligence analyst at the Indian Cyber Crime Coordination Centre (I4C).
                Analyze this real-time ATM interdiction target:
                - Incident: {incident_id}
                - Stolen Amount: INR {mule_info.total_stolen_amount:,.2f}
                - Terminal Mule Account: {mule_info.terminal_account} ({mule_info.terminal_holder_name}) at {mule_info.kyc_branch_name}
                - Target ATM: {bank_name} ({atm_id}), Operator: {operator}
                - Distance to Anchor: {dist} km
                - Interdiction Risk Score: {score:.1f}%
                - Interdiction Window: {operational_window_mins} minutes

                Write EXACTLY TWO CRISP SENTENCES:
                Sentence 1: Summarize the illicit multi-hop fund layering and sudden accumulation in the terminal mule account.
                Sentence 2: Detail the imminent physical cash-out threat at {bank_name} ATM ({dist} km away) and specify the actionable {operational_window_mins}-minute interdiction window before cash dispensing.
                """
                resp = model.generate_content(prompt)
                tactical_briefing = resp.text.strip()
            except Exception as e:
                print(f"[Gemini 2.5 Drawer Fallback]: {e}")

        if not tactical_briefing:
            tactical_briefing = (
                f"Proceeds of fraud totaling INR {mule_info.total_stolen_amount:,.2f} have been layered across {mule_info.hops_count} banking hops into dormant mule account {mule_info.terminal_account} ({mule_info.terminal_holder_name}) at {mule_info.kyc_branch_name}. "
                f"Spatial interdiction telemetry isolates candidate {bank_name} ATM ({operator}, {dist} km away) with a {score:.1f}% cash-out probability, leaving an actionable {operational_window_mins}-minute tactical window for police patrol interception."
            )

        legal_notice = self.draft_section_102_bnss_notice(
            incident_id=incident_id,
            mule_info=mule_info
        )

        return {
            "tactical_briefing": tactical_briefing,
            "legal_notice_draft": legal_notice.draft_body,
            "legal_notice_obj": legal_notice,
            "atm_metadata": atm_metadata,
            "operational_window_mins": operational_window_mins
        }

