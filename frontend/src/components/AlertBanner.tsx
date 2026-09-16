/**
 * CyberSuraksha - Alert / Notification Simulator
 * 
 * When a newly ingested complaint crosses the critical risk threshold, displays
 * a prominent toast notification simulating inter-agency coordination:
 * "Simulated Alert: would notify Officer + Bank Nodal Contact"
 * (No external SMS or email dependencies required for hackathon demo).
 */

"use client";

import React, { useState, useEffect } from "react";
import { EnrichedAlert, useLiveFeedContext } from "@/lib/liveFeedSimulator";
import { BANK_NAME_DISCLAIMER } from "@/lib/mockDataset";
import {
  Bell,
  Radio,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
  Building2,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";

export interface AlertBannerProps {
  threshold?: number;
  onReviewAlert?: (alert: EnrichedAlert) => void;
}

export default function AlertBanner({
  threshold = 60,
  onReviewAlert
}: AlertBannerProps) {
  const { latestAlert, selectAlert } = useLiveFeedContext();
  const [activeNotification, setActiveNotification] = useState<EnrichedAlert | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Trigger when a new alert arrives and crosses threshold
  useEffect(() => {
    if (!latestAlert) return;

    if (latestAlert.assessment.compositeScore >= threshold) {
      setActiveNotification(latestAlert);
      setIsVisible(true);

      // Auto-hide after 7.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 7500);

      return () => clearTimeout(timer);
    }
  }, [latestAlert, threshold]);

  if (!isVisible || !activeNotification) {
    return null;
  }

  const { complaint, assessment } = activeNotification;
  const isCritical = assessment.compositeScore > 70;

  const handleReview = () => {
    setIsVisible(false);
    selectAlert(activeNotification.id);
    if (onReviewAlert) {
      onReviewAlert(activeNotification);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-[var(--grey-0)]/95 backdrop-blur-md border-2 border-red-500/60 rounded-xl shadow-2xl p-4 text-xs space-y-3 relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />

        {/* Header: Simulated Alert Disclaimer */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
              <Radio className="w-4 h-4 animate-ping" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span>LIVE CRITICAL INCIDENT ALERT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              </div>
              <div className="text-white font-bold text-xs">
                Active Coordination: Resend Nodal Email + Resend Patrol Email Field Interdiction
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-md text-[var(--grey-1000)] hover:text-white hover:bg-[var(--grey-400)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Snapshot */}
        <div className="bg-[var(--grey-100)] p-2.5 rounded-lg border border-[var(--grey-700)] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[var(--blue-link)] font-semibold">{complaint.id}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 font-bold border border-red-500/30">
              Risk {assessment.compositeScore}/100 • {assessment.threatLevel}
            </span>
          </div>

          <div className="flex items-center justify-between text-white">
            <span className="text-[var(--grey-1100)]">{complaint.crimeCategory}:</span>
            <span className="font-mono font-bold text-[var(--red-primary)]">
              ₹{complaint.stolenAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--grey-1100)]">
            <span className="flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 text-[var(--blue-link)] flex-shrink-0" />
              <span className="truncate">{complaint.targetAtm.bankName} ATM</span>
            </span>
            <span className="font-mono text-amber-400 font-semibold flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              ~{assessment.urgencyWindowMinutes}m exit
            </span>
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[9px] text-[var(--grey-900)] italic">
            {BANK_NAME_DISCLAIMER}
          </span>

          <button
            onClick={handleReview}
            className="px-3 py-1.5 rounded-lg bg-[var(--red-primary)] hover:bg-red-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <span>Review & Recommend Action</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
