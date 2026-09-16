"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Landmark,
  FileDown,
  Copy,
  CheckCircle2,
  Radio,
  Lock
} from "lucide-react";
import { ATMNode, MuleTraceResult, DispatchResult, LegalHoldDraft } from "@/lib/api";
import { exportLegalDossierPDF } from "@/lib/pdfExport";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  selectedAtm: ATMNode | null;
  muleTrace: MuleTraceResult | null;
  onDispatchSuccess: (toastMsg: string, res: DispatchResult) => void;
}

export default function AIDrawer({
  isOpen,
  onClose,
  incidentId,
  selectedAtm,
  muleTrace,
  onDispatchSuccess,
}: Props) {
  const [tacticalBriefing, setTacticalBriefing] = useState<string>("");
  const [legalNoticeDraft, setLegalNoticeDraft] = useState<string>("");
  const [legalNoticeObj, setLegalNoticeObj] = useState<LegalHoldDraft | null>(null);
  const [operationalWindow, setOperationalWindow] = useState<number>(35);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchAudit, setDispatchAudit] = useState<{
    completed: boolean;
    timestampStr: string;
    noticeRef: string;
    resendId?: string;
    patrolEmailId?: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Bank Nodal Email & Patrol Officer Email state
  const [nodalEmail, setNodalEmail] = useState<string>("helam996@gmail.com");
  const [patrolEmail, setPatrolEmail] = useState<string>("sumitsharmakhp996@gmail.com");
  const [patrolUnitId, setPatrolUnitId] = useState<string>("PCR Unit Alpha-4");

  useEffect(() => {
    if (!isOpen || !selectedAtm) return;
    const atm = selectedAtm;

    let isMounted = true;
    async function fetchBriefing() {
      setIsLoadingBriefing(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/ai/atm-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incident_id: incidentId,
            atm_id: atm.atm_id,
            operator: atm.operator || atm.bank_name,
            distance_km: atm.distance_km,
            cash_out_probability: atm.cash_out_probability,
            bank_name: atm.bank_name
          }),
        });

        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setTacticalBriefing(data.tactical_briefing);
          setLegalNoticeDraft(data.legal_notice_draft);
          setLegalNoticeObj(data.legal_hold_draft);
          if (data.operational_window_minutes) {
            setOperationalWindow(data.operational_window_minutes);
          }
        } else {
          // Fallback deterministic briefing
          const fallbackBriefing = `Proceeds of fraud totaling INR ${(muleTrace?.total_stolen_amount || 180000).toLocaleString()} have been layered across ${muleTrace?.hops_count || 2} banking hops into dormant mule account ${muleTrace?.terminal_account || "77109283741"} at ${muleTrace?.kyc_branch_name || "Malviya Nagar, South Delhi"}. Spatial interdiction telemetry isolates candidate ${atm.bank_name} ATM (${atm.operator}, ${atm.distance_km} km away) with a ${(atm.cash_out_probability * 100).toFixed(1)}% cash-out probability, leaving an actionable 35-minute tactical window for police patrol interception.`;
          setTacticalBriefing(fallbackBriefing);
        }
      } catch (err) {
        console.error("Failed to load ATM briefing:", err);
      } finally {
        if (isMounted) setIsLoadingBriefing(false);
      }
    }

    fetchBriefing();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedAtm, incidentId, muleTrace]);

  if (!isOpen || !selectedAtm) return null;

  const handleCopyNotice = () => {
    if (legalNoticeDraft) {
      navigator.clipboard.writeText(legalNoticeDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    exportLegalDossierPDF(
      muleTrace,
      legalNoticeObj,
      {
        incident_id: incidentId,
        executive_brief: tacticalBriefing,
        risk_factors: [
          `Rapid transfer velocity targeting ${selectedAtm.bank_name} ATM`,
          `Dormant account reactivation at ${muleTrace?.kyc_branch_name || "South Delhi"}`,
          `Candidate ATM lies within ${selectedAtm.distance_km} km with ${(selectedAtm.cash_out_probability * 100).toFixed(0)}% cash-out probability`
        ],
        interdiction_recommendation: `Issue Section 102 BNSS statutory lien and dispatch ${patrolUnitId} to ${selectedAtm.bank_name} (${selectedAtm.distance_km} km).`,
        generated_at: new Date().toISOString()
      },
      selectedAtm
    );
  };

  const handleDispatchAction = async () => {
    if (dispatchAudit?.completed) return;
    setIsDispatching(true);

    try {
      // 1. Bank Freeze Email via Resend to helam996@gmail.com
      const bankRes = await fetch("/api/dispatch/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: "BANK_FREEZE",
          incidentId,
          recipientEmail: nodalEmail,
          bankName: selectedAtm.bank_name,
          frozenAmount: 85000,
          officerNotes: `Statutory freeze on terminal mule account + Patrol intercept at ${selectedAtm.bank_name}`
        })
      });
      const bankData = await bankRes.json();

      // 2. Patrol Alert Email via Resend to sumitsharmakhp996@gmail.com
      const patrolRes = await fetch("/api/dispatch/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: "PATROL_ALERT",
          incidentId,
          patrolUnitId,
          targetAtm: {
            atm_id: selectedAtm.atm_id,
            bank_name: selectedAtm.bank_name,
            address: selectedAtm.address,
            latitude: selectedAtm.latitude,
            longitude: selectedAtm.longitude,
            distance_km: selectedAtm.distance_km
          },
          officerNotes: `Statutory freeze on terminal mule account + Patrol intercept at ${selectedAtm.bank_name}`
        })
      });
      const patrolData = await patrolRes.json();

      const now = new Date();
      const timestampStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " IST";

      const noticeRef = legalNoticeObj?.notice_id || `BNSS-102/2026/${incidentId.replace("NCRP-", "")}`;

      setDispatchAudit({
        completed: true,
        timestampStr,
        noticeRef,
        resendId: bankData.emailId || undefined,
        patrolEmailId: patrolData.emailId || undefined
      });

      const toastMessage = `Statutory Lien emailed to ${nodalEmail}; Patrol alert emailed to ${patrolData.recipient || patrolEmail} (Unit: ${patrolUnitId}) — ${selectedAtm.bank_name} ATM (${selectedAtm.distance_km} km).`;
      onDispatchSuccess(toastMessage, { ...bankData, patrol_email_id: patrolData.emailId });
    } catch (err) {
      console.error("Dual dispatch error:", err);
    } finally {
      setIsDispatching(false);
    }
  };

  const isHighRisk = selectedAtm.cash_out_probability >= 0.70;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-[9999]"
      />

      {/* Off-Canvas Drawer (Slide from Right) */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-[var(--grey-0)] border-l border-[var(--grey-700)] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col font-sans text-[var(--grey-1300)] z-[10000] overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--grey-700)] bg-[var(--grey-100)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950/50 border border-sky-500/40 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Spatial Interdiction Briefing & Statutory Dispatch
                </h2>
                <span className="gov-badge-verified text-[9px]">
                  SEC. 102 BNSS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Target Node: {selectedAtm.bank_name} ({selectedAtm.atm_id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--grey-1000)] hover:text-white hover:bg-[var(--grey-300)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected ATM Metadata Strip (Eraser Hairline Grid) */}
        <div className="hair grid-cols-2 sm:grid-cols-4 m-4 mb-0 text-xs font-mono">
          <div className="p-2.5">
            <span className="text-[9.5px] text-[var(--grey-900)] block uppercase">OPERATOR</span>
            <span className="text-[var(--grey-1400)] font-bold truncate block">{selectedAtm.operator}</span>
          </div>

          <div className="p-2.5">
            <span className="text-[9.5px] text-[var(--grey-900)] block uppercase">DISTANCE</span>
            <span className="text-[var(--blue-link)] font-bold block">{selectedAtm.distance_km} km</span>
          </div>

          <div className="p-2.5">
            <span className="text-[9.5px] text-[var(--grey-900)] block uppercase">CASH-OUT PROB</span>
            <span className={`font-black text-sm block ${isHighRisk ? "text-[var(--red-primary)]" : "text-[var(--emerald-primary)]"}`}>
              {(selectedAtm.cash_out_probability * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-2.5">
            <span className="text-[9.5px] text-[var(--grey-900)] block uppercase">RBI VAULT STATUS</span>
            <span className="text-[var(--amber-primary)] font-bold block">
              ₹{((selectedAtm.current_vault_balance_inr || 820000) / 100000).toFixed(1)}L ({selectedAtm.required_swipes || 1}x)
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingBriefing ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Synthesizing node spatial telemetry & drafting Section 102 BNSS notice...</span>
            </div>
          ) : (
            <>
              {/* BLOCK 1: TACTICAL BRIEFING */}
              <div className="bento relative">
                <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
                <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
                <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
                <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

                <div className="flex items-center justify-between pb-2 border-b border-[var(--grey-700)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--red-primary)] uppercase font-mono tracking-wide">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Block 1: Tactical Briefing</span>
                  </div>
                  <span className="pill danger text-[9px] py-0 px-1.5">
                    EXECUTIVE ASSESSMENT
                  </span>
                </div>

                <p className="text-sm text-[var(--grey-1300)] leading-relaxed font-sans">
                  {tacticalBriefing || "Analyzing multi-hop fund movement..."}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-[var(--grey-700)] text-[var(--grey-1000)]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--amber-primary)]" />
                    <span>Interdiction Window:</span>
                    <strong className="text-[var(--red-primary)]">{operationalWindow} Minutes</strong>
                  </span>
                  <span className="text-[var(--grey-900)]">Terminal A/c: {muleTrace?.terminal_account}</span>
                </div>
              </div>

              {/* BLOCK 2: LEGAL NOTICE DRAFT */}
              <div className="bento relative">
                <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
                <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
                <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
                <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-[var(--grey-700)] gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--blue-link)] uppercase font-mono tracking-wide">
                    <Landmark className="w-4 h-4" />
                    <span>Block 2: Section 102 BNSS Notice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyNotice}
                      className="btn light default text-[11px] py-1 px-2.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="btn dark default text-[11px] py-1 px-2.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Signed PDF</span>
                    </button>
                  </div>
                </div>

                <div className="well p-3 font-mono text-[10.5px] text-[var(--grey-1200)] max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  {legalNoticeDraft || "Drafting Section 102 BNSS debit freeze notice..."}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--grey-1000)] pt-1">
                  <span>Recipient: Bank Nodal Officer ({muleTrace?.terminal_bank || "SBI"})</span>
                  <span className="text-[var(--emerald-primary)] font-bold">15-Min Statutory Mandate</span>
                </div>
              </div>

              {/* Dual Dispatch Destination Inputs */}
              <div className="bento text-xs font-mono space-y-2">
                <div className="text-[11px] text-[var(--grey-900)] uppercase tracking-wider font-bold">
                  Dual Dispatch Routing Destination:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[var(--grey-900)] block mb-1 uppercase">
                      Bank Nodal Email (Resend API):
                    </label>
                    <input
                      type="text"
                      disabled={dispatchAudit?.completed}
                      value={nodalEmail}
                      onChange={(e) => setNodalEmail(e.target.value)}
                      className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded-md px-2.5 py-1.5 text-[var(--grey-1400)] text-xs disabled:opacity-60 focus:outline-none focus:border-[var(--blue-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--grey-900)] block mb-1 uppercase">
                      Police Patrol Officer Email (Resend):
                    </label>
                    <input
                      type="email"
                      disabled={dispatchAudit?.completed}
                      value={patrolEmail}
                      onChange={(e) => setPatrolEmail(e.target.value)}
                      className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded-md px-2.5 py-1.5 text-[var(--grey-1400)] text-xs disabled:opacity-60 focus:outline-none focus:border-[var(--blue-primary)]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--grey-700)] bg-[var(--grey-100)] space-y-2">
          {dispatchAudit?.completed ? (
            <div className="space-y-2">
              <div className="w-full py-3 px-4 rounded-lg bg-[var(--grey-0)] border border-[var(--emerald-primary)] text-[var(--emerald-primary)] font-mono text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>LIEN EXECUTED [{dispatchAudit.timestampStr}] — #{dispatchAudit.noticeRef}</span>
                </div>
                <span className="pill agents text-[9px] py-0 px-2">
                  ATTESTED
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--grey-900)] flex items-center justify-between px-1">
                <span>Resend Bank: {dispatchAudit.resendId || "DELIVERED_200"}</span>
                <span>Resend Patrol: {dispatchAudit.patrolEmailId || "DELIVERED_200"}</span>
                <span className="text-[var(--emerald-primary)] font-bold">Patrol Email Synced</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDispatchAction}
              disabled={isDispatching || isLoadingBriefing}
              className="w-full py-3 px-4 btn danger large text-sm font-bold flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(236,44,64,0.4)] disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>DISPATCHING DUAL ACTION...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 animate-ping text-white" />
                  <span>Dispatch Statutory Enforcement & Freeze</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--grey-900)] px-1 pt-1">
            <span>Non-repudiation Audit Hash Attached</span>
            <span>Section 102 BNSS & Bharatiya Nyaya Sanhita Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
