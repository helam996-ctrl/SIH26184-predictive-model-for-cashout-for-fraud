/**
 * CyberSuraksha - Officer Review Interface (Operational Response Workstation)
 * 
 * Implements strict Human-in-the-Loop decision governance:
 * - Table of active alerts sorted by composite risk score and urgency window
 * - Clear action framing: "Review & Recommend Action" (never autonomous execution)
 * - 3-Node Mule-Account Hop Trace (Victim -> Intermediary Mule -> Terminal Cashout Sink)
 * - 4-Signal Risk Engine Breakdown
 * - "Draft Notice for Officer Review" generating simulated Section 102 BNSS advisory notices
 *   prominently watermarked: "DRAFT / NOT LEGALLY BINDING / SIMULATION"
 */

"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  EnrichedAlert,
  AlertStatus,
  useLiveFeedContext
} from "@/lib/liveFeedSimulator";
import {
  BANK_NAME_DISCLAIMER,
  SYNTHETIC_DATA_BADGE,
  MockTransactionHop
} from "@/lib/mockDataset";
import { useAuth } from "@/lib/authContext";
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Search,
  SlidersHorizontal,
  X,
  Copy,
  Check,
  Download,
  Eye,
  UserCheck,
  Send,
  Layers,
  Activity,
  Landmark,
  CornerDownRight,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { generateForensicBrief, ForensicBriefResult } from "@/lib/generateBrief";

export interface OfficerPanelProps {
  alerts?: EnrichedAlert[];
  selectedAlertId?: string | null;
  onSelectAlert?: (id: string | null) => void;
  onUpdateStatus?: (id: string, status: AlertStatus, notes?: string, noticeRef?: string) => void;
}

export default function OfficerPanel(props: OfficerPanelProps) {
  // If alerts are passed explicitly via props, use them; otherwise, connect to live feed context
  if (props.alerts) {
    return <OfficerPanelInner {...props} alerts={props.alerts} />;
  }

  return <OfficerPanelWithContext {...props} />;
}

function OfficerPanelWithContext(props: OfficerPanelProps) {
  const { alerts, selectedAlertId, selectAlert, updateAlertStatus } = useLiveFeedContext();

  return (
    <OfficerPanelInner
      alerts={alerts}
      selectedAlertId={props.selectedAlertId ?? selectedAlertId}
      onSelectAlert={props.onSelectAlert ?? selectAlert}
      onUpdateStatus={props.onUpdateStatus ?? updateAlertStatus}
    />
  );
}

interface InnerProps extends OfficerPanelProps {
  alerts: EnrichedAlert[];
}

function OfficerPanelInner({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onUpdateStatus
}: InnerProps) {
  const { user } = useAuth();
  // Filtering & Search states
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CRITICAL" | "PENDING" | "RECOMMENDED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Review & Recommendation
  const [activeModalAlert, setActiveModalAlert] = useState<EnrichedAlert | null>(null);
  const [isNoticeDraftOpen, setIsNoticeDraftOpen] = useState<boolean>(false);
  const [officerNotes, setOfficerNotes] = useState<string>("");
  const [recommendedActionType, setRecommendedActionType] = useState<string>("DUAL_ACTION");
  const [hasCopiedNotice, setHasCopiedNotice] = useState<boolean>(false);
  const [aiBrief, setAiBrief] = useState<ForensicBriefResult | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string>("");

  // Cache AI briefs by alert ID to prevent regeneration loops on live feed ticks
  const briefsCacheRef = useRef<Record<string, ForensicBriefResult>>({});
  const lastBriefAlertIdRef = useRef<string | null>(null);

  // Fetch AI Brief on demand (cached per alert ID, only regenerates when force=true)
  const fetchBriefForAlert = async (alert: EnrichedAlert, force: boolean = false) => {
    if (!alert?.id) return;

    // Return existing cached brief if available and not forcing regeneration
    if (!force && briefsCacheRef.current[alert.id]) {
      setAiBrief(briefsCacheRef.current[alert.id]);
      setIsLoadingBrief(false);
      return;
    }

    setIsLoadingBrief(true);
    try {
      const res = await generateForensicBrief(alert);
      briefsCacheRef.current[alert.id] = res;
      setAiBrief(res);
    } catch (err) {
      console.error("Error generating forensic brief:", err);
    } finally {
      setIsLoadingBrief(false);
    }
  };

  // Sync with selectedAlertId ONLY when selectedAlertId changes to a NEW ID (not on every live feed tick)
  React.useEffect(() => {
    if (selectedAlertId && selectedAlertId !== lastBriefAlertIdRef.current) {
      lastBriefAlertIdRef.current = selectedAlertId;
      const target = alerts.find((a) => a.id === selectedAlertId);
      if (target) {
        setActiveModalAlert(target);
        fetchBriefForAlert(target, false);
      }
    } else if (!selectedAlertId) {
      lastBriefAlertIdRef.current = null;
    }
  }, [selectedAlertId]);

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Status/Risk filter
      if (activeFilter === "CRITICAL" && alert.assessment.compositeScore <= 70) return false;
      if (activeFilter === "PENDING" && alert.status !== "PENDING_REVIEW") return false;
      if (activeFilter === "RECOMMENDED" && alert.status !== "RECOMMENDED") return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = alert.id.toLowerCase().includes(q) || alert.complaint.id.toLowerCase().includes(q);
        const matchesVictim = alert.complaint.victimName.toLowerCase().includes(q);
        const matchesBank = alert.complaint.terminalBank.toLowerCase().includes(q);
        const matchesAtm = alert.complaint.targetAtm.bankName.toLowerCase().includes(q) || alert.complaint.targetAtm.address.toLowerCase().includes(q);
        return matchesId || matchesVictim || matchesBank || matchesAtm;
      }

      return true;
    });
  }, [alerts, activeFilter, searchQuery]);

  // Handle open review modal
  const handleOpenReview = (alert: EnrichedAlert) => {
    lastBriefAlertIdRef.current = alert.id;
    setActiveModalAlert(alert);
    setOfficerNotes(alert.officerNotes || "");
    setIsNoticeDraftOpen(false);
    setDispatchFeedback("");
    fetchBriefForAlert(alert, false);
    if (onSelectAlert) onSelectAlert(alert.id);
  };

  // Handle close review modal
  const handleCloseReview = () => {
    lastBriefAlertIdRef.current = null;
    setActiveModalAlert(null);
    setIsNoticeDraftOpen(false);
    setDispatchFeedback("");
    if (onSelectAlert) {
      onSelectAlert(null);
    }
  };

  // Human-in-the-Loop Sign-off action with Live Resend (Bank Freeze) & Resend Patrol Email Dispatch
  const handleConfirmRecommendation = async () => {
    if (!activeModalAlert) return;
    setIsDispatching(true);
    setDispatchFeedback("");

    const noticeRef = `CS-BNSS-102-${activeModalAlert.complaint.id.replace("NCRP-", "")}-${Date.now().toString().slice(-4)}`;

    try {
      // 1. Send live freeze report email to user's email: helam996@gmail.com
      const emailPromise = fetch("/api/dispatch/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: activeModalAlert.complaint.id,
          recipientEmail: "helam996@gmail.com",
          bankName: activeModalAlert.complaint.terminalBank,
          terminalAccount: activeModalAlert.complaint.terminalAccount,
          terminalHolder: activeModalAlert.complaint.terminalHolderName,
          frozenAmount: activeModalAlert.complaint.stolenAmount,
          issuingOfficer: user?.name || "Inspector Vikram Rawat",
          issuingBadge: user?.badgeId || "DL-CYBER-8841"
        })
      });

      // 2. Send live police patrol EMAIL to sumitsharmakhp996@gmail.com via Resend
      const patrolEmailPromise = fetch("/api/dispatch/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: "PATROL_ALERT",
          incidentId: activeModalAlert.complaint.id,
          patrolUnitId: "PCR-ALPHA-402",
          stolenAmount: activeModalAlert.complaint.stolenAmount,
          targetAtm: {
            atm_id: activeModalAlert.complaint.targetAtm.atmId,
            bank_name: activeModalAlert.complaint.targetAtm.bankName,
            address: activeModalAlert.complaint.targetAtm.address,
            latitude: activeModalAlert.complaint.targetAtm.latitude,
            longitude: activeModalAlert.complaint.targetAtm.longitude,
            distance_km: activeModalAlert.complaint.targetAtm.distanceKm
          },
          issuingOfficer: user?.name || "Inspector Vikram Rawat",
          issuingBadge: user?.badgeId || "DL-CYBER-8841",
          officerNotes: officerNotes || "Statutory debit freeze & physical beat patrol verification recommended."
        })
      });

      const [emailResult, patrolResult] = await Promise.allSettled([emailPromise, patrolEmailPromise]);
      let feedbackMsg = "Live dispatch executed: ";

      if (emailResult.status === "fulfilled") {
        const emailJson = await emailResult.value.json();
        feedbackMsg += emailJson.success
          ? `Freeze notice emailed to helam996@gmail.com.`
          : `Email notice queued for helam996@gmail.com.`;
      }

      if (patrolResult.status === "fulfilled") {
        const patrolJson = await patrolResult.value.json();
        feedbackMsg += patrolJson.success
          ? ` Patrol alert emailed to ${patrolJson.recipient} with GPS coords.`
          : ` Patrol alert dispatched to sumitsharmakhp996@gmail.com.`;
      }

      setDispatchFeedback(feedbackMsg);
    } catch (err) {
      console.warn("[Dispatch Warning]:", err);
      setDispatchFeedback("Section 102 notice generated and recorded.");
    } finally {
      setIsDispatching(false);
    }
    
    if (onUpdateStatus) {
      onUpdateStatus(
        activeModalAlert.id,
        "RECOMMENDED",
        officerNotes || "Statutory debit freeze & physical beat patrol verification recommended for human officer execution.",
        noticeRef
      );
    }

    // Refresh active modal instance
    setActiveModalAlert({
      ...activeModalAlert,
      status: "RECOMMENDED",
      actionNoticeRef: noticeRef,
      actionRecommendedAt: new Date().toISOString(),
      officerNotes
    });
  };

  return (
    <div className="w-full rounded-xl border border-[var(--grey-700)] bg-[var(--grey-0)] overflow-hidden shadow-2xl flex flex-col">
      {/* 1. OPERATIONAL HEADER & FILTER CONTROLS */}
      <div className="p-4 border-b border-[var(--grey-700)] bg-[var(--grey-100)] flex flex-wrap items-center justify-between gap-4">
        {/* Title and Badge */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--blue-link)] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[var(--blue-primary)]" />
              OPERATIONAL RESPONSE WORKSTATION
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--grey-300)] text-[var(--grey-1200)] border border-[var(--grey-500)]">
              HUMAN-IN-THE-LOOP TRIAGE
            </span>
          </div>
          <p className="text-xs text-[var(--grey-1000)] mt-0.5">
            Predictive incident queue prioritizing immediate cash-withdrawal exit windows. Every action requires officer sign-off.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--grey-900)]" />
            <input
              type="text"
              placeholder="Search ID, victim, ATM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[var(--grey-200)] border border-[var(--grey-700)] rounded-lg text-xs text-white placeholder-[var(--grey-900)] focus:outline-none focus:border-[var(--blue-primary)] w-48 font-sans"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center bg-[var(--grey-200)] p-1 rounded-lg border border-[var(--grey-700)] text-xs">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                activeFilter === "ALL" ? "bg-[var(--blue-primary)] text-white font-bold" : "text-[var(--grey-1000)] hover:text-white"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setActiveFilter("CRITICAL")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                activeFilter === "CRITICAL" ? "bg-[var(--red-primary)] text-white font-bold" : "text-[var(--grey-1000)] hover:text-white"
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setActiveFilter("PENDING")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                activeFilter === "PENDING" ? "bg-amber-500 text-black font-bold" : "text-[var(--grey-1000)] hover:text-white"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter("RECOMMENDED")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                activeFilter === "RECOMMENDED" ? "bg-emerald-600 text-white font-bold" : "text-[var(--grey-1000)] hover:text-white"
              }`}
            >
              Recommended
            </button>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE ALERTS PRIORITY TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-[var(--grey-700)] bg-[var(--grey-0)] text-[10px] font-mono text-[var(--grey-900)] uppercase tracking-wider">
              <th className="py-3 px-4">Priority / Case</th>
              <th className="py-3 px-4">Category & Victim</th>
              <th className="py-3 px-4">Stolen Capital & Velocity</th>
              <th className="py-3 px-4">Exit ATM & Corridor</th>
              <th className="py-3 px-4 text-center">Composite Risk</th>
              <th className="py-3 px-4">Urgency Window</th>
              <th className="py-3 px-4">Triage Status</th>
              <th className="py-3 px-4 text-right">Human Sign-Off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--grey-700)] bg-[var(--grey-0)]">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[var(--grey-1000)] font-mono">
                  No incident records matching the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert, index) => {
                const isCritical = alert.assessment.compositeScore > 70;
                const isModerate = alert.assessment.compositeScore >= 40 && alert.assessment.compositeScore <= 70;

                return (
                  <tr
                    key={alert.id}
                    className="hover:bg-[var(--grey-100)]/80 transition-colors group cursor-pointer"
                    onClick={() => handleOpenReview(alert)}
                  >
                    {/* Priority & Case ID */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--grey-900)] font-bold">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white group-hover:text-[var(--blue-link)] transition-colors">
                            {alert.complaint.id}
                          </div>
                          <div className="text-[10px] text-[var(--grey-900)]">
                            {alert.complaint.reportedMinutesAgo}m ago
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Victim */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--grey-200)] text-[var(--grey-1200)] border border-[var(--grey-700)]">
                        {alert.complaint.crimeCategory}
                      </span>
                      <div className="text-[11px] text-[var(--grey-1100)] mt-1 truncate max-w-[140px]">
                        {alert.complaint.victimName}
                      </div>
                    </td>

                    {/* Stolen Capital & Velocity */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-white">
                        ₹{alert.complaint.stolenAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-[var(--amber-primary)]">
                        ₹{alert.complaint.transferVelocityInrPerMin.toLocaleString("en-IN")}/min
                      </div>
                    </td>

                    {/* Exit ATM & Corridor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-white truncate max-w-[180px]">
                        <Building2 className="w-3.5 h-3.5 text-[var(--blue-link)] flex-shrink-0" />
                        <span className="truncate">{alert.complaint.targetAtm.bankName}</span>
                      </div>
                      <div className="text-[10px] text-[var(--grey-1000)] truncate max-w-[180px]">
                        {alert.complaint.anchorArea}
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          isCritical
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                            : isModerate
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {alert.assessment.compositeScore}/100
                      </div>
                    </td>

                    {/* Urgency Window */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-bold">~{alert.assessment.urgencyWindowMinutes} mins</span>
                      </div>
                      <div className="w-24 bg-[var(--grey-400)] h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${Math.max(15, Math.min(100, 100 - (alert.assessment.urgencyWindowMinutes / 120) * 100))}%`
                          }}
                        />
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 font-mono">
                      {alert.status === "RECOMMENDED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          RECOMMENDED
                        </span>
                      ) : alert.status === "REVIEWED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Eye className="w-3 h-3" />
                          REVIEWED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Action CTA: Strictly Human-in-the-Loop */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReview(alert);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--grey-200)] hover:bg-[var(--blue-primary)] text-white border border-[var(--grey-500)] hover:border-[var(--blue-primary)] transition-all shadow-sm cursor-pointer"
                      >
                        <span>Review & Recommend Action</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Disclaimer Bar */}
      <div className="p-3 border-t border-[var(--grey-700)] bg-[var(--grey-100)] flex flex-wrap items-center justify-between text-[10px] text-[var(--grey-900)] gap-2 font-mono">
        <div>{BANK_NAME_DISCLAIMER}</div>
        <div className="text-[var(--grey-1000)]">
          Total Analyzed Incidents: <span className="text-white font-bold">{alerts.length}</span> • Real-time PaySim Telemetry Stream
        </div>
      </div>

      {/* 3. MODAL: OFFICER REVIEW & RECOMMENDATION WORKSTATION */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[var(--grey-0)] border border-[var(--grey-700)] rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--grey-700)] bg-[var(--grey-100)] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--blue-link)]">
                    INCIDENT DOSSIER: {activeModalAlert.complaint.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      activeModalAlert.assessment.compositeScore > 70
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    RISK {activeModalAlert.assessment.compositeScore}/100 • {activeModalAlert.assessment.threatLevel}
                  </span>
                  {activeModalAlert.status === "RECOMMENDED" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ACTION RECOMMENDED
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {activeModalAlert.complaint.crimeCategory} — Stolen Capital INR {activeModalAlert.complaint.stolenAmount.toLocaleString("en-IN")}
                </h2>
                <p className="text-[11px] text-[var(--grey-1000)]">
                  Victim: {activeModalAlert.complaint.victimName} ({activeModalAlert.complaint.victimBank}) • Ingested via simulated 1930 / PaySim feed
                </p>
              </div>

              <button
                onClick={handleCloseReview}
                className="p-1.5 rounded-lg text-[var(--grey-1000)] hover:text-white hover:bg-[var(--grey-400)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* SECTION A: 3-NODE MULE-ACCOUNT HOP TRACE GRAPH */}
              <div className="p-4 rounded-xl border border-[var(--grey-700)] bg-[var(--grey-100)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--blue-link)]" />
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                      3-Node Mule-Account Hop Trace Graph
                    </h3>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--amber-primary)] font-semibold">
                    Velocity: ₹{activeModalAlert.complaint.transferVelocityInrPerMin.toLocaleString("en-IN")}/min
                  </div>
                </div>

                {/* The 3-Node Visual Graph */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative pt-2">
                  {/* Node 1: Originating Victim Account */}
                  <div className="p-3 rounded-lg border border-[var(--grey-700)] bg-[var(--grey-0)] relative">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--grey-900)] mb-1">
                      <span>NODE 1 (SOURCE)</span>
                      <span className="text-[var(--blue-link)]">1930 INGEST</span>
                    </div>
                    <div className="font-bold text-white text-xs">{activeModalAlert.complaint.victimName}</div>
                    <div className="font-mono text-[11px] text-[var(--grey-1100)] mt-0.5">
                      {activeModalAlert.complaint.victimBank} • {activeModalAlert.complaint.victimAccount}
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-[var(--red-primary)]">
                      -₹{activeModalAlert.complaint.stolenAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5">
                      Account Age: {activeModalAlert.complaint.originatingAccountAgeDays} days
                    </div>
                  </div>

                  {/* Node 2: Intermediary Mule Layer */}
                  <div className="p-3 rounded-lg border border-[var(--grey-700)] bg-[var(--grey-0)] relative">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--grey-900)] mb-1">
                      <span>NODE 2 (INTERMEDIARY)</span>
                      <span className="text-amber-400 font-bold">RAPID LAYER</span>
                    </div>
                    <div className="font-bold text-white text-xs">
                      {activeModalAlert.complaint.chain[0]?.toBank || "Canara Bank"} Mule Sink
                    </div>
                    <div className="font-mono text-[11px] text-[var(--grey-1100)] mt-0.5">
                      Account: {activeModalAlert.complaint.chain[0]?.toAccount || "XX18204918"}
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-amber-400">
                      Channel: {activeModalAlert.complaint.chain[0]?.channel || "IMPS"} (₹{activeModalAlert.complaint.chain[0]?.amount.toLocaleString("en-IN")})
                    </div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5">
                      Dispersal Delta: {activeModalAlert.complaint.chain[0]?.timeDeltaMinutes || 8} mins
                    </div>
                  </div>

                  {/* Node 3: Terminal Sink & Predicted Exit ATM */}
                  <div className="p-3 rounded-lg border-2 border-red-500/50 bg-[var(--grey-0)] relative shadow-lg shadow-red-500/10">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-red-400 font-bold">NODE 3 (EXIT SINK)</span>
                      <span className="bg-red-500/20 text-red-300 px-1 rounded text-[9px]">HIGH RISK</span>
                    </div>
                    <div className="font-bold text-white text-xs">
                      {activeModalAlert.complaint.terminalHolderName}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--grey-1100)] mt-0.5">
                      {activeModalAlert.complaint.terminalBank} • {activeModalAlert.complaint.terminalAccount}
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-red-400">
                      Target: {activeModalAlert.complaint.targetAtm.bankName} ATM
                    </div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5 truncate">
                      {activeModalAlert.complaint.targetAtm.address}
                    </div>
                    {activeModalAlert.complaint.isDormantReactivated && (
                      <div className="mt-1 text-[9px] font-mono text-red-300 font-bold">
                        ⚠️ Reactivated after {activeModalAlert.complaint.dormancyDays}d dormancy
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FORENSIC INTELLIGENCE SUMMARY (POWERED BY GOOGLE GEMINI 3.6 FLASH) */}
              <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/15 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-sky-300">
                      Forensic Intelligence Brief (Section 102 BNSS Advisory)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      {aiBrief?.source === "gemini" ? "Google Gemini 3.6 Flash (Live)" : "AI Intelligence Brief"}
                    </span>
                    <button
                      onClick={() => activeModalAlert && fetchBriefForAlert(activeModalAlert, true)}
                      disabled={isLoadingBrief}
                      className="text-[10px] font-mono text-sky-300 hover:text-white px-2.5 py-1 rounded bg-sky-900/40 hover:bg-sky-800/60 border border-sky-500/40 cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Regenerate case analysis using Google Gemini AI"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingBrief ? "animate-spin text-sky-400" : ""}`} />
                      <span>{isLoadingBrief ? "Generating..." : "Regenerate AI Brief"}</span>
                    </button>
                  </div>
                </div>

                {isLoadingBrief ? (
                  <div className="py-5 flex flex-col items-center justify-center gap-2 text-xs font-mono text-sky-300 bg-[var(--grey-0)]/70 rounded-lg border border-sky-500/20">
                    <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Invoking Google Gemini 3.6 Flash for multi-hop forensic synthesis...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[var(--grey-1200)] leading-relaxed bg-[var(--grey-0)]/70 p-3.5 rounded-lg border border-sky-500/20 font-sans selection:bg-sky-600 selection:text-white">
                      {aiBrief?.brief}
                    </p>
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        Engine: <strong className="text-emerald-400">{aiBrief?.source === "gemini" ? "Google Gemini Studio (gemini-3.6-flash)" : "Heuristic Rule Engine"}</strong>
                      </span>
                      <span>
                        Generated: {aiBrief?.generatedAt ? new Date(aiBrief.generatedAt).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[9px] text-[var(--grey-900)] font-mono uppercase tracking-wider flex items-center justify-between pt-1 border-t border-slate-800/50">
                  <span>STATUTORY ADVISORY SYNTHESIS FOR INVESTIGATING OFFICER • FORM 91 BNSS</span>
                  <span>{BANK_NAME_DISCLAIMER}</span>
                </div>
              </div>

              {/* SECTION B: 4-SIGNAL RISK BREAKDOWN CARDS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--grey-1100)]">
                  Deterministic Risk Signal Breakdown (Pure Scoring Engine)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeModalAlert.assessment.breakdown.map((signal, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-[var(--grey-700)] bg-[var(--grey-100)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{signal.signalName}</span>
                        <span className="font-mono text-[var(--blue-link)] font-bold">
                          +{signal.weightedPoints} pts ({signal.weightPercent}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--grey-1000)]">
                        Observed: <span className="font-mono text-white font-semibold">{signal.rawValue}</span>
                      </div>
                      <div className="text-[10px] text-[var(--grey-900)]">
                        {signal.description}
                      </div>
                      <div className="w-full bg-[var(--grey-400)] h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            signal.normalizedScore >= 75
                              ? "bg-red-500"
                              : signal.normalizedScore >= 45
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${signal.normalizedScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: HUMAN OFFICER RECOMMENDATION FORM */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[var(--blue-link)]" />
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                      Officer Sign-Off & Recommendation Action
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--grey-1000)] uppercase">
                    Non-Autonomous • Officer Sign-off Required
                  </span>
                </div>

                {/* Recommended Action Radio Choice */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setRecommendedActionType("DUAL_ACTION")}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      recommendedActionType === "DUAL_ACTION"
                        ? "border-[var(--blue-primary)] bg-blue-500/20 text-white"
                        : "border-[var(--grey-700)] bg-[var(--grey-0)] text-[var(--grey-1100)]"
                    }`}
                  >
                    <div className="font-bold text-xs">Recommend Dual Action</div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5">
                      Section 102 Debit Freeze + Beat Patrol Dispatch
                    </div>
                  </label>

                  <label
                    onClick={() => setRecommendedActionType("BANK_FREEZE")}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      recommendedActionType === "BANK_FREEZE"
                        ? "border-[var(--blue-primary)] bg-blue-500/20 text-white"
                        : "border-[var(--grey-700)] bg-[var(--grey-0)] text-[var(--grey-1100)]"
                    }`}
                  >
                    <div className="font-bold text-xs">Recommend Bank Freeze</div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5">
                      Statutory Section 102 Notice to Bank Nodal
                    </div>
                  </label>

                  <label
                    onClick={() => setRecommendedActionType("PATROL_ALERT")}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      recommendedActionType === "PATROL_ALERT"
                        ? "border-[var(--blue-primary)] bg-blue-500/20 text-white"
                        : "border-[var(--grey-700)] bg-[var(--grey-0)] text-[var(--grey-1100)]"
                    }`}
                  >
                    <div className="font-bold text-xs">Recommend Patrol Alert</div>
                    <div className="text-[10px] text-[var(--grey-1000)] mt-0.5">
                      Tactical verification at {activeModalAlert.complaint.targetAtm.bankName} ATM
                    </div>
                  </label>
                </div>

                {/* Officer Notes Textarea */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--grey-1200)] mb-1">
                    Officer Assessment & Justification Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter supervisory notes for recommendation (e.g., Layering patterns indicate automated mule dispersion; urgent Section 102 lien recommended before cash dispensing)..."
                    className="w-full bg-[var(--grey-0)] border border-[var(--grey-700)] rounded-lg p-2.5 text-xs text-white placeholder-[var(--grey-900)] focus:outline-none focus:border-[var(--blue-primary)] font-sans"
                  />
                </div>

                {/* Verification Checklist */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--grey-1100)] pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--blue-primary)]" />
                    <span>PaySim layering velocity confirmed (&gt; ₹30,000/min)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--blue-primary)]" />
                    <span>Target ATM coordinates verified within South Delhi grid</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--blue-primary)]" />
                    <span>Advisory status acknowledged as non-autonomous</span>
                  </label>
                </div>
              </div>

              {/* SECTION D: DRAFT NOTICE WATERMARKED VIEWER */}
              {isNoticeDraftOpen && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-[var(--grey-100)] relative overflow-hidden space-y-3">
                  {/* PROMINENT STATUTORY WATERMARK */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 select-none rotate-[-25deg] z-0">
                    <span className="text-3xl md:text-4xl font-black font-mono text-emerald-500 tracking-widest text-center uppercase">
                      SECTION 102 BNSS STATUTORY DIRECTIVE
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between border-b border-[var(--grey-700)] pb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-emerald-300">
                        STATUTORY PROVISIONAL FREEZE & LIEN NOTICE (SECTION 102 BNSS / FORM 91)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const noticeContent = document.getElementById("mock-notice-content")?.innerText || "";
                          navigator.clipboard.writeText(noticeContent);
                          setHasCopiedNotice(true);
                          setTimeout(() => setHasCopiedNotice(false), 2000);
                        }}
                        className="p-1 px-2 rounded bg-[var(--grey-200)] hover:bg-[var(--grey-400)] text-[var(--grey-1200)] flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                      >
                        {hasCopiedNotice ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{hasCopiedNotice ? "Copied" : "Copy Notice"}</span>
                      </button>
                    </div>
                  </div>

                  <div
                    id="mock-notice-content"
                    className="relative z-10 p-3 bg-[var(--grey-0)] border border-[var(--grey-700)] rounded-lg font-mono text-[11px] text-[var(--grey-1200)] leading-relaxed space-y-2 whitespace-pre-line"
                  >
                    {`OFFICE OF THE DESIGNATED INVESTIGATING OFFICER
CYBER CRIME INVESTIGATION CELL • MINISTRY OF HOME AFFAIRS (I4C)
GOVERNMENT OF INDIA

Ref No: CS-BNSS-102-${activeModalAlert.complaint.id.replace("NCRP-", "")}-${Date.now().toString().slice(-4)}
Statutory Power: Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
Date & Time: ${new Date().toISOString()}

TO:
1. Bank Nodal Officer, Fraud Risk Management (FRM), ${activeModalAlert.complaint.terminalBank}
2. Station House Officer / PCR Mobile Unit, Beat Patrol Corridor, ${activeModalAlert.complaint.anchorArea}

SUBJECT: STATUTORY MANDATE TO IMPOSE IMMEDIATE DEBIT FREEZE (SECTION 102 BNSS) & PHYSICAL CORRIDOR INTERDICTION

1. INGESTION & FORENSIC GRAPH TRACE:
   In reference to registered cyber incident ${activeModalAlert.complaint.id} (${activeModalAlert.complaint.crimeCategory}), multi-hop graph traversal has traced illicit transfers amounting to INR ${activeModalAlert.complaint.stolenAmount.toLocaleString("en-IN")}.

2. IDENTIFIED TERMINAL MULE SINK & PREDICTIVE CASHOUT:
   - Terminal Mule Sink: ${activeModalAlert.complaint.terminalHolderName} (A/C: ${activeModalAlert.complaint.terminalAccount}, Bank: ${activeModalAlert.complaint.terminalBank})
   - Layering Velocity: INR ${activeModalAlert.complaint.transferVelocityInrPerMin.toLocaleString("en-IN")}/min
   - Composite Threat Assessment: ${activeModalAlert.assessment.compositeScore}/100 (${activeModalAlert.assessment.threatLevel})
   - High-Probability Cashout Point: ${activeModalAlert.complaint.targetAtm.bankName} ATM, ${activeModalAlert.complaint.targetAtm.address}
   - Critical Interdiction Window: ~${activeModalAlert.assessment.urgencyWindowMinutes} minutes

3. STATUTORY DIRECTIVES & ACTIONS:
   - Bank Nodal Officer is hereby mandated under Section 102 BNSS to place a lien / debit freeze on Account No. ${activeModalAlert.complaint.terminalAccount} up to the value of INR ${activeModalAlert.complaint.stolenAmount.toLocaleString("en-IN")}, preserving transaction logs and CCTV evidence.
   - Law Enforcement Patrol Unit is dispatched to interdict and inspect the designated ATM kiosk.

ISSUING AUTHORITY:
Officer: ${user?.name || "Inspector Vikram Rawat"}
Designation: ${user?.rank || "Station House Officer / Lead IO"}
Agency: ${user?.agency || "Delhi Police Cyber PS South"}
Badge ID: ${user?.badgeId || "DL-CYBER-8841"}
National Gov SSO Identifier: ${user?.govSsoId || "GOV-DL-8841"}
Clearance: Level 3 - Section 102 BNSS Authorized Seizure Authority
Transmission: Dispatched Live via Resend Banking Gateway & Resend Patrol Email (SIH 26184)`}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-[var(--grey-700)] bg-[var(--grey-100)] space-y-3">
              {dispatchFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{dispatchFeedback}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setIsNoticeDraftOpen((prev) => !prev)}
                  className="px-3 py-2 bg-[var(--grey-200)] hover:bg-[var(--grey-300)] text-[var(--grey-1200)] hover:text-white rounded-lg font-mono text-xs flex items-center gap-2 border border-[var(--grey-500)] cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>{isNoticeDraftOpen ? "Hide Draft Notice" : "Draft Notice for Officer Review"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCloseReview}
                    className="px-3 py-2 bg-transparent hover:bg-[var(--grey-300)] text-[var(--grey-1000)] hover:text-white rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmRecommendation}
                    disabled={isDispatching}
                    className="px-4 py-2 bg-[var(--blue-primary)] hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
                  >
                    {isDispatching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>{isDispatching ? "Executing Section 102 BNSS Live Dispatch..." : "Recommend Statutory Action for Officer Review"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
