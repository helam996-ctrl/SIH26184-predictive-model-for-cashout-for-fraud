"use client";

import React from "react";
import { ArrowRight, Landmark, Clock, Activity, Cpu, AlertTriangle } from "lucide-react";
import { MuleTraceResult } from "@/lib/api";

interface Props {
  muleTrace: MuleTraceResult;
}

export default function MultiHopChainVisualizer({ muleTrace }: Props) {
  return (
    <div className="bento relative">
      <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--grey-700)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--grey-200)] border border-[var(--grey-500)] text-[var(--blue-link)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--grey-1400)] uppercase font-mono tracking-wider flex items-center gap-2">
              <span>Multi-Hop Layering Graph & Mule Tracing</span>
              <span className="pill brand text-[10px] py-0.5 px-2">
                {muleTrace.hops_count} HOPS RESOLVED
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey-1000)] mt-0.5">
              Recursive graph traversal isolates terminal laundering sink before physical ATM cashout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[9.5px] uppercase text-[var(--grey-900)] block">Transfer Velocity</span>
            <span className="text-[var(--amber-primary)] font-bold">
              ₹{muleTrace.transfer_velocity_inr_per_min.toLocaleString()}/min
            </span>
          </div>
          <div className="h-6 w-px bg-[var(--grey-700)]"></div>
          <div className="text-right">
            <span className="text-[9.5px] uppercase text-[var(--grey-900)] block">Time Elapsed</span>
            <span className="text-[var(--blue-link)] font-bold">{muleTrace.time_delta_minutes} mins</span>
          </div>
        </div>
      </div>

      {/* Eraser Diagram Flow Representation */}
      <div className="overflow-x-auto pb-1 pt-1">
        <div className="flex items-center gap-2 min-w-[700px]">
          {/* Originating Victim Node */}
          <div className="flex-1 bg-[var(--grey-100)] border border-[var(--grey-700)] rounded-lg p-3 relative shadow-[var(--x-small-shadow)]">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-[var(--grey-900)] uppercase">ORIGINATING DEBIT</span>
              <span className="pill neutral text-[9px] py-0 px-1.5">1930 INGEST</span>
            </div>
            <div className="text-xs font-bold text-[var(--grey-1400)] truncate">Victim Account</div>
            <div className="text-[10.5px] font-mono text-[var(--grey-1000)] mt-0.5 truncate">
              UTR: {muleTrace.chain[0]?.utr || "INITIAL-UTR"}
            </div>
            <div className="text-xs font-black font-mono text-[var(--red-primary)] mt-1">
              ₹{muleTrace.total_stolen_amount.toLocaleString()}
            </div>
          </div>

          {/* Intermediary Hops */}
          {muleTrace.chain.map((hop, index) => (
            <React.Fragment key={hop.hop_id}>
              <div className="flex flex-col items-center justify-center px-1 text-[var(--grey-800)] flex-shrink-0">
                <span className="text-[9px] font-mono text-[var(--blue-link)] font-bold">{hop.channel}</span>
                <ArrowRight className="w-4 h-4 text-[var(--grey-500)]" />
                <span className="text-[8px] font-mono text-[var(--grey-900)]">L{hop.hop_level}</span>
              </div>

              {/* Intermediary Hop Node */}
              {index < muleTrace.chain.length - 1 && (
                <div className="flex-1 bg-[var(--grey-100)] border border-[var(--grey-700)] rounded-lg p-3 shadow-[var(--x-small-shadow)]">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-[var(--grey-900)] uppercase">LAYER {hop.hop_level} MULE</span>
                    <span className="text-[var(--grey-1000)]">{hop.to_bank_ifsc}</span>
                  </div>
                  <div className="text-xs font-mono font-medium text-[var(--grey-1300)] truncate">
                    A/c {hop.to_account}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--grey-900)] truncate mt-0.5">
                    UTR: {hop.utr}
                  </div>
                  <div className="text-xs font-bold font-mono text-[var(--amber-primary)] mt-1">
                    ₹{hop.amount.toLocaleString()}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Terminal Mule Node (High-Alert Focus) */}
          <div className="flex-[1.2] bg-[var(--grey-100)] border-2 border-[var(--red-primary)] rounded-lg p-3 shadow-[0_0_18px_rgba(236,44,64,0.25)] relative">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="pill danger text-[9px] py-0 px-1.5">
                TERMINAL SINK
              </span>
              <span className="text-[var(--red-primary)] font-bold">{muleTrace.terminal_ifsc}</span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {muleTrace.terminal_holder_name}
            </div>
            <div className="text-[10.5px] font-mono text-[var(--grey-1100)] mt-0.5">
              A/c: {muleTrace.terminal_account}
            </div>
            <div className="text-sm font-black font-mono text-[var(--red-primary)] mt-1 flex items-center justify-between">
              <span>₹{muleTrace.total_stolen_amount.toLocaleString()}</span>
              {muleTrace.is_dormant_reactivated && (
                <span className="pill microsites text-[9px] py-0 px-1.5">
                  DORMANT WEAPONIZED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Resolution Hairline Grid */}
      <div className="hair grid-cols-1 md:grid-cols-3 mt-1 text-xs font-mono">
        <div className="p-2.5 flex items-center gap-2.5">
          <Landmark className="w-4 h-4 text-[var(--blue-link)] flex-shrink-0" />
          <div className="truncate">
            <span className="text-[9.5px] text-[var(--grey-900)] uppercase block">KYC Home Branch</span>
            <span className="text-[var(--grey-1300)] truncate font-bold">{muleTrace.kyc_branch_name}</span>
          </div>
        </div>
        <div className="p-2.5 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[var(--amber-primary)] flex-shrink-0" />
          <div>
            <span className="text-[9.5px] text-[var(--grey-900)] uppercase block">Account Age / Dormancy</span>
            <span className="text-[var(--grey-1300)] font-bold">
              {muleTrace.mule_account_age_days} Days (Sudden Multi-Lakh Spike)
            </span>
          </div>
        </div>
        <div className="p-2.5 flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-[var(--emerald-primary)] flex-shrink-0" />
          <div>
            <span className="text-[9.5px] text-[var(--grey-900)] uppercase block">GPS Anchor Coordinates</span>
            <span className="text-[var(--emerald-primary)] font-bold">
              {muleTrace.kyc_latitude.toFixed(4)}° N, {muleTrace.kyc_longitude.toFixed(4)}° E
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
