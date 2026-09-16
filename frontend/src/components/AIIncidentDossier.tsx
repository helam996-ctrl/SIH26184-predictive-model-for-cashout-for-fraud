"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  ShieldAlert,
  Send,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Scale,
  FileDown,
  Lock
} from "lucide-react";
import { IncidentSummaryResponse, LegalHoldDraft, ATMNode, MuleTraceResult } from "@/lib/api";
import { exportLegalDossierPDF } from "@/lib/pdfExport";

interface DispatchAuditState {
  completed: boolean;
  timestampStr: string;
  noticeRef: string;
}

interface Props {
  incidentSummary: IncidentSummaryResponse | null;
  legalDraft: LegalHoldDraft | null;
  selectedAtm: ATMNode | null;
  muleTrace?: MuleTraceResult | null;
  onOpenDispatch: () => void;
  isLoading: boolean;
  isDispatching?: boolean;
  dispatchAudit?: DispatchAuditState | null;
}

export default function AIIncidentDossier({
  incidentSummary,
  legalDraft,
  selectedAtm,
  muleTrace,
  onOpenDispatch,
  isLoading,
  isDispatching = false,
  dispatchAudit = null,
}: Props) {
  const [showFullDraft, setShowFullDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (legalDraft?.draft_body) {
      navigator.clipboard.writeText(legalDraft.draft_body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    exportLegalDossierPDF(muleTrace || null, legalDraft, incidentSummary, selectedAtm);
  };

  return (
    <div className="bento relative">
      <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--grey-700)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-950/50 border border-sky-500/40 text-sky-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <span>Forensic Intelligence Dossier</span>
              <span className="gov-badge-verified text-[9.5px]">
                SEC. 102 BNSS MANDATE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Statutory provisional seizure order & multi-hop financial velocity analysis
            </p>
          </div>
        </div>

        {/* Dispatch Action Button / Immutable Audit State */}
        {dispatchAudit?.completed ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--grey-100)] border border-[var(--emerald-primary)] text-[var(--emerald-primary)] text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              LIEN EXECUTED [{dispatchAudit.timestampStr}] — #{dispatchAudit.noticeRef}
            </span>
            <Lock className="w-3.5 h-3.5 opacity-75 ml-1 flex-shrink-0" />
          </div>
        ) : (
          <button
            onClick={onOpenDispatch}
            disabled={isDispatching || isLoading}
            className="btn danger default shadow-[0_0_15px_rgba(236,44,64,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDispatching ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>DISPATCHING DUAL ACTION...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>AUTHORIZE DUAL DISPATCH</span>
              </>
            )}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2 text-[var(--grey-1000)] font-mono text-xs">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Synthesizing multi-hop banking topology & drafting Section 102 BNSS order...</span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Executive Forensic Brief Box */}
          <div className="well p-3.5 space-y-2 border-[var(--grey-700)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--purple-primary)] uppercase font-mono">
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Forensic Intelligence Brief</span>
            </div>
            <p className="text-xs text-[var(--grey-1300)] leading-relaxed font-sans">
              {incidentSummary?.executive_brief || "Telemetry analysis in progress..."}
            </p>

            {/* Risk Factor Bullets */}
            <div className="space-y-1 pt-1.5">
              <span className="text-[10px] font-mono text-[var(--grey-900)] uppercase tracking-wider block">
                Primary Risk Signals:
              </span>
              {incidentSummary?.risk_factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--grey-1200)] font-mono">
                  <span className="text-[var(--red-primary)] mt-0.5">•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            {/* Directive */}
            <div className="mt-2 pt-2 border-t border-[var(--grey-700)] text-xs font-mono text-[var(--blue-link)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--blue-link)] flex-shrink-0" />
              <span>{incidentSummary?.interdiction_recommendation}</span>
            </div>
          </div>

          {/* Section 102 BNSS / Form 91 Statutory Seizure Notice Preview */}
          {legalDraft && (
            <div className="border border-[var(--amber-primary)]/40 bg-[var(--grey-100)] rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--amber-primary)] font-mono uppercase">
                  <Scale className="w-4 h-4" />
                  <span>Section 102 BNSS / Form 91 Statutory Seizure Notice</span>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                  <button
                    onClick={copyToClipboard}
                    className="btn light default text-[11px] py-1 px-2.5"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--emerald-primary)]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Notice"}</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="btn dark default text-[11px] py-1 px-2.5 shadow-sm"
                    title="Generate Signed Section 102 BNSS Seizure Order Dossier"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Signed PDF</span>
                  </button>

                  <button
                    onClick={() => setShowFullDraft(!showFullDraft)}
                    className="btn light default text-[11px] py-1 px-2"
                  >
                    {showFullDraft ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showFullDraft ? "Collapse" : "Expand"}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-mono text-[var(--grey-1200)] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--grey-900)]">Notice Reference:</span>
                  <span className="text-[var(--amber-primary)] font-bold">{legalDraft.notice_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--grey-900)]">Target Bank & A/c:</span>
                  <span className="text-[var(--grey-1400)]">{legalDraft.bank_name} - {legalDraft.terminal_account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--grey-900)]">Statutory Freeze Mandate:</span>
                  <span className="text-[var(--red-primary)] font-bold">INR {legalDraft.frozen_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Collapsible Full Notice Body */}
              {showFullDraft && (
                <div className="mt-3 pt-3 border-t border-[var(--grey-700)]">
                  <pre className="text-[10.5px] font-mono bg-[var(--grey-0)] p-3 rounded-md text-[var(--grey-1200)] overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed border border-[var(--grey-700)] select-all">
                    {legalDraft.draft_body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
