/**
 * CyberSuraksha - Kalshi-Style Threat Market Card
 * 
 * Modeled directly on Kalshi's high-contrast prediction market cards:
 * - Binary probability action buttons: "RECOMMEND HOLD 88¢" vs "MONITOR ONLY 12¢"
 * - High-contrast monospace typography for amounts and risk percentage
 * - Live category pills and countdown timers
 */

"use client";

import React from "react";
import { EnrichedAlert } from "@/lib/liveFeedSimulator";
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  Building2,
  AlertTriangle,
  Zap,
  CheckCircle2
} from "lucide-react";

interface Props {
  alert: EnrichedAlert;
  isSelected?: boolean;
  onSelect: (alertId: string) => void;
  onReview: (alert: EnrichedAlert) => void;
}

export default function KalshiThreatCard({
  alert,
  isSelected = false,
  onSelect,
  onReview
}: Props) {
  const score = alert.assessment.compositeScore;
  const isHighRisk = score > 70;
  const isModRisk = score >= 40 && score <= 70;

  return (
    <div
      onClick={() => onSelect(alert.id)}
      className={`kalshi-card p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
        isSelected
          ? "border-[#00d26a] ring-1 ring-[#00d26a]/40 bg-[#131926]"
          : "hover:border-[rgba(255,255,255,0.18)]"
      }`}
    >
      {/* Top Row: Category Pill & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="kalshi-badge bg-[#141a26] text-[#94a3b8] border border-[rgba(255,255,255,0.08)] text-[10px]">
          {alert.complaint.crimeCategory}
        </span>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 font-bold">
            &lt; {alert.assessment.urgencyWindowMinutes}m ETA
          </span>
        </div>
      </div>

      {/* Center Row: Target ATM & Stolen Capital */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-white font-semibold truncate">
          <Building2 className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0" />
          <span className="truncate">{alert.complaint.targetAtm.bankName} ATM</span>
          <span className="text-[10px] font-mono text-[#64748b]">({alert.complaint.targetAtm.atmId})</span>
        </div>
        <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
          {alert.complaint.targetAtm.address}
        </p>

        {/* Capital At Risk Monospace Metric */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="text-[10px] uppercase font-mono text-[#64748b] tracking-wider">
            Capital At Risk
          </div>
          <div className="text-base font-extrabold font-mono text-white tracking-tight">
            ₹{alert.complaint.stolenAmount.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Risk Probability Bar */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#94a3b8]">Cash-Out Probability:</span>
            <span
              className={`font-bold ${
                isHighRisk ? "text-[#ff4557]" : isModRisk ? "text-amber-400" : "text-[#00d26a]"
              }`}
            >
              {score}% Likelihood
            </span>
          </div>
          <div className="w-full bg-[#1b2436] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHighRisk ? "bg-[#ff4557]" : isModRisk ? "bg-amber-400" : "bg-[#00d26a]"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Kalshi-style Yes/No Binary Buttons */}
      <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReview(alert);
          }}
          className="kalshi-btn-yes py-2 px-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-bold"
        >
          <span>RECOMMEND HOLD</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(alert.id);
          }}
          className="kalshi-btn-secondary py-2 px-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer text-[#94a3b8] font-bold"
        >
          <span>MONITOR</span>
        </button>
      </div>
    </div>
  );
}
