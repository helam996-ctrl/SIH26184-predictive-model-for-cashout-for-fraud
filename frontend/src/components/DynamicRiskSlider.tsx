"use client";

import React from "react";
import { Sliders, AlertTriangle, Zap, RotateCcw } from "lucide-react";

interface Props {
  threshold: number;
  onChange: (val: number) => void;
  highRiskCount: number;
  totalCandidates: number;
}

export default function DynamicRiskSlider({
  threshold,
  onChange,
  highRiskCount,
  totalCandidates
}: Props) {
  return (
    <div className="bento relative">
      <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--grey-200)] border border-[var(--grey-500)] text-[var(--red-primary)]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--grey-1400)] uppercase font-mono tracking-wider flex items-center gap-2">
              <span>Risk Threshold Calibration</span>
              <span className="pill danger text-[10px] py-0.5 px-2">
                τ = {threshold.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey-1000)] mt-0.5">
              Filters spatial candidate nodes based on composite Random Forest + ADTK anomaly probability
            </p>
          </div>
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="pill neutral flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3 h-3 text-[var(--red-primary)] animate-pulse" />
            <span className="text-[var(--red-primary)] font-bold">{highRiskCount}</span>
            <span className="text-[var(--grey-900)]">/ {totalCandidates} High-Risk ATMs</span>
          </div>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="space-y-1 pt-1">
        <input
          type="range"
          min="0.50"
          max="0.95"
          step="0.05"
          value={threshold}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[var(--grey-300)] rounded-lg appearance-none cursor-pointer accent-[var(--red-primary)] focus:outline-none"
        />
        <div className="flex justify-between text-[10px] font-mono text-[var(--grey-900)] px-0.5">
          <span>0.50 (High Sensitivity)</span>
          <span className="text-[var(--grey-1100)] font-bold">0.70 (Operational Benchmark)</span>
          <span>0.95 (High Specificity)</span>
        </div>
      </div>

      {/* Sensitivity Insight Strip */}
      <div className="pt-2 border-t border-[var(--grey-700)] flex items-center justify-between text-[11px] text-[var(--grey-1000)] font-mono">
        <div className="flex items-center gap-1.5 truncate pr-2">
          <Zap className="w-3.5 h-3.5 text-[var(--amber-primary)] flex-shrink-0" />
          <span className="truncate">
            {threshold < 0.65
              ? "Aggressive Interdiction: Broad perimeter to intercept all suspected exit nodes."
              : threshold > 0.80
              ? "Conservative Interdiction: High-precision focus on imminent cashout sinks."
              : "Calibrated Standard: Optimal trade-off between patrol coverage and alert fatigue."}
          </span>
        </div>
        <button
          onClick={() => onChange(0.70)}
          className="text-[10px] text-[var(--blue-link)] hover:text-white font-mono flex items-center gap-1 flex-shrink-0 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset 0.70</span>
        </button>
      </div>
    </div>
  );
}
