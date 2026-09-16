/**
 * CyberSuraksha - Predictive Cybercrime Interdiction Dashboard (SIH26184)
 * 
 * Kalshi-Inspired UI & Aesthetic Revamp:
 * - Ultra-modern dark obsidian aesthetic (#07090e, hairline borders, Kalshi mint green #00d26a)
 * - Medium-sized resizable map with multi-level sizing and fullscreen expandability
 * - Full Personnel Authentication & Registration integration
 * - Live Cash-Out Prediction Market cards with binary probability buttons
 * - Section 102 BNSS Human-in-the-loop Statutory Officer Review Interface
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  LiveFeedProvider,
  useLiveFeedContext,
  EnrichedAlert
} from "@/lib/liveFeedSimulator";
import CommandHeader from "@/components/CommandHeader";
import RiskHeatmap from "@/components/RiskHeatmap";
import OfficerPanel from "@/components/OfficerPanel";
import AlertBanner from "@/components/AlertBanner";
import PersistentFooter from "@/components/PersistentFooter";
import KalshiThreatCard from "@/components/KalshiThreatCard";
import {
  BANK_NAME_DISCLAIMER,
  SYNTHETIC_DATA_BADGE
} from "@/lib/mockDataset";
import {
  LayoutDashboard,
  MapPin,
  ListFilter,
  ShieldAlert,
  Activity,
  Zap,
  Clock,
  Compass,
  Building2,
  TrendingUp,
  Columns,
  Rows,
  Layers,
  ShieldCheck
} from "lucide-react";

export default function CyberSurakshaDashboard() {
  return (
    <LiveFeedProvider options={{ intervalMs: 8000, initialBatchCount: 6, autoStart: true }}>
      <DashboardContent />
    </LiveFeedProvider>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const {
    alerts,
    selectedAlertId,
    selectAlert,
    updateAlertStatus,
    totalProcessedCount
  } = useLiveFeedContext();

  const [activeTab, setActiveTab] = useState<"COMMAND" | "MAP" | "OFFICER">("COMMAND");
  const [activePersona, setActivePersona] = useState<"i4c" | "lea" | "bank">("i4c");
  const [commandLayout, setCommandLayout] = useState<"SPLIT" | "STACKED">("SPLIT");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Verifying authorized terminal session...</span>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const criticalCount = alerts.filter((a) => a.assessment.compositeScore > 70).length;
  const pendingCount = alerts.filter((a) => a.status === "PENDING_REVIEW").length;
  const recommendedCount = alerts.filter((a) => a.status === "RECOMMENDED").length;

  const totalCapitalAtRisk = alerts.reduce(
    (acc, item) => acc + item.complaint.stolenAmount,
    0
  );

  // Top 3 urgent alerts for the Kalshi prediction market strip
  const topUrgentAlerts = [...alerts]
    .sort((a, b) => b.assessment.compositeScore - a.assessment.compositeScore)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex flex-col font-sans selection:bg-[#ff4557] selection:text-white">
      {/* 1. TOP SIMULATION ALERT TOAST BANNER */}
      <AlertBanner
        threshold={65}
        onReviewAlert={(alert: EnrichedAlert) => {
          setActiveTab("OFFICER");
          selectAlert(alert.id);
        }}
      />

      {/* 2. COMMAND HEADER WITH KALSHI AESTHETIC & AUTHENTICATION */}
      <CommandHeader
        telemetry={{
          coordination_latency_seconds: 42.8,
          coordination_latency_target_seconds: 60.0,
          traditional_latency_hours: "24 - 72 hours",
          latency_reduction_percent: 98.9,
          active_interdiction_window_mins: 45,
          stolen_funds_intercepted_today_inr: totalCapitalAtRisk,
          total_terminal_accounts_frozen: recommendedCount + 12,
          beat_patrol_interdictions_successful: 14,
          resend_delivery_rate: "99.8%",
          patrol_email_dispatch_rate: "100.0%"
        }}
        activePersona={activePersona}
        onSelectPersona={setActivePersona}
        operationalWindowMins={45}
      />

      {/* 3. SUB-NAV / VIEW SWITCHER STRIP (KALSHI STYLE) */}
      <div className="bg-[#0d111a] border-b border-[rgba(255,255,255,0.08)] px-4 py-2">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-[#07090e] p-1 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <button
              onClick={() => setActiveTab("COMMAND")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "COMMAND"
                  ? "bg-[#141a26] text-white font-bold shadow-md border border-[rgba(255,255,255,0.12)]"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#00d26a]" />
              <span>Operational Command</span>
            </button>

            <button
              onClick={() => setActiveTab("MAP")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "MAP"
                  ? "bg-[#141a26] text-white font-bold shadow-md border border-[rgba(255,255,255,0.12)]"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Spatial Risk Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab("OFFICER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "OFFICER"
                  ? "bg-[#141a26] text-white font-bold shadow-md border border-[rgba(255,255,255,0.12)]"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-400" />
              <span>Officer Workstation ({pendingCount} Pending)</span>
            </button>
          </div>

          {/* Quick Stats Strip & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {activeTab === "COMMAND" && (
              <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-[rgba(255,255,255,0.08)] hidden md:flex">
                <button
                  onClick={() => setCommandLayout("SPLIT")}
                  title="Side-by-side balanced split layout"
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    commandLayout === "SPLIT" ? "bg-[#141a26] text-white" : "text-[#64748b] hover:text-white"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCommandLayout("STACKED")}
                  title="Stacked full-width layout"
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    commandLayout === "STACKED" ? "bg-[#141a26] text-white" : "text-[#64748b] hover:text-white"
                  }`}
                >
                  <Rows className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[#64748b] uppercase">Critical Incidents:</span>
              <span className="font-bold text-[#ff4557] bg-[#ff4557]/10 px-2 py-0.5 rounded border border-[#ff4557]/20 animate-pulse">
                {criticalCount} Active
              </span>
            </div>

            <div className="h-3 w-px bg-[#1e2638] hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[#64748b] uppercase">Ingested:</span>
              <span className="font-bold text-white">
                {totalProcessedCount} complaints
              </span>
            </div>

            <div className="h-3 w-px bg-[#1e2638] hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[#64748b] uppercase">Capital Tracked:</span>
              <span className="font-bold text-[#00d26a]">
                ₹{totalCapitalAtRisk.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 space-y-6">
        {/* VIEW 1: COMBINED COMMAND CENTER */}
        {activeTab === "COMMAND" && (
          <div className="space-y-6">
            {/* Top Row: Medium-Sized Resizable Map + Kalshi Prediction Stream */}
            {commandLayout === "SPLIT" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Columns: Medium Spatial Map */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00d26a]" />
                      <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                        South Delhi / NCR Spatial Exit Radar
                      </h2>
                      <span className="kalshi-badge kalshi-badge-live text-[9px]">MEDIUM VIEW</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b]">
                      Green &lt;40 • Yellow 40-70 • Red &gt;70
                    </span>
                  </div>

                  <RiskHeatmap
                    selectedAlertId={selectedAlertId}
                    onSelectAlert={(id) => selectAlert(id)}
                    onRecommendAction={(alert) => {
                      setActiveTab("OFFICER");
                      selectAlert(alert.id);
                    }}
                  />
                </div>

                {/* Right 5 Columns: Kalshi Prediction Market Threat Stream */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00d26a]" />
                      <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                        Live Cash-Out Prediction Markets
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#00d26a] font-bold">
                      ● ORDER BOOK (PROBABILITIES)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topUrgentAlerts.map((alert) => (
                      <KalshiThreatCard
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlertId === alert.id}
                        onSelect={(id) => selectAlert(id)}
                        onReview={(a) => {
                          setActiveTab("OFFICER");
                          selectAlert(a.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Stacked View: Medium Map on top, then Kalshi cards row */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00d26a]" />
                      <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                        Spatial Cash-Withdrawal Exit Prediction Map (South Delhi / NCR)
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b]">
                      Green &lt;40 • Yellow 40-70 • Red &gt;70
                    </span>
                  </div>

                  <RiskHeatmap
                    selectedAlertId={selectedAlertId}
                    onSelectAlert={(id) => selectAlert(id)}
                    onRecommendAction={(alert) => {
                      setActiveTab("OFFICER");
                      selectAlert(alert.id);
                    }}
                  />
                </div>

                {/* Top Prediction Markets Carousel Row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00d26a]" />
                      <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                        Top Cash-Out Candidates at Risk
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b]">
                      Probabilistic ATM Dispense Likelihood
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topUrgentAlerts.map((alert) => (
                      <KalshiThreatCard
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlertId === alert.id}
                        onSelect={(id) => selectAlert(id)}
                        onReview={(a) => {
                          setActiveTab("OFFICER");
                          selectAlert(a.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Grid: Operational Response Workstation Table */}
            <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <OfficerPanel
                selectedAlertId={selectedAlertId}
                onSelectAlert={(id) => selectAlert(id)}
                onUpdateStatus={updateAlertStatus}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: EXPANDED SPATIAL HEATMAP */}
        {activeTab === "MAP" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <MapPin className="w-4 h-4 text-[#00d26a]" />
                  PREDICTIVE CASH-OUT HEATMAP & ATM EXIT CORRIDOR ANALYTICS
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Plots ATM candidate exit points based on PaySim layering velocity, dormant account addresses, and historical cluster proximity.
                </p>
              </div>
            </div>

            <RiskHeatmap
              selectedAlertId={selectedAlertId}
              onSelectAlert={(id) => selectAlert(id)}
              onRecommendAction={(alert) => {
                setActiveTab("OFFICER");
                selectAlert(alert.id);
              }}
            />
          </div>
        )}

        {/* VIEW 3: DEDICATED OFFICER REVIEW WORKSTATION */}
        {activeTab === "OFFICER" && (
          <div className="space-y-3">
            <OfficerPanel
              selectedAlertId={selectedAlertId}
              onSelectAlert={(id) => selectAlert(id)}
              onUpdateStatus={updateAlertStatus}
            />
          </div>
        )}
      </main>

      {/* 5. PERSISTENT MINIMAL FOOTER ("Made by Code Stark") */}
      <PersistentFooter />
    </div>
  );
}
