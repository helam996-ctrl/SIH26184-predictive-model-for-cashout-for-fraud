"use client";

import React, { useState } from "react";
import { X, PlusCircle, AlertOctagon, CheckCircle2, Database } from "lucide-react";
import { ingestFraudComplaint } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: any) => void;
}

export default function ComplaintIngestModal({ isOpen, onClose, onSuccess }: Props) {
  const [incidentId, setIncidentId] = useState(`NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [sourceAccount, setSourceAccount] = useState("44892019382");
  const [victimName, setVictimName] = useState("Rajesh Malhotra");
  const [victimPhone, setVictimPhone] = useState("9811002233");
  const [utr, setUtr] = useState(`UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [amount, setAmount] = useState(275000);
  const [channel, setChannel] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const payload = {
      incident_id: incidentId,
      source_account: sourceAccount,
      victim_name: victimName,
      victim_phone: victimPhone,
      utr: utr,
      amount: parseFloat(amount.toString()),
      channel: channel,
      reporting_agency: "1930 / I4C CFCFRMS Stream"
    };

    try {
      const res = await ingestFraudComplaint(payload);
      setStatusMsg({
        type: "success",
        text: `Complaint ${res.incident_id} validated and injected into spatial interdiction buffer!`
      });
      setTimeout(() => {
        onSuccess(payload);
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: `Validation Error: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bento max-w-lg w-full relative shadow-2xl">
        <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
        <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
        <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
        <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--grey-1000)] hover:text-white p-1 rounded-lg hover:bg-[var(--grey-300)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[var(--grey-700)] pb-3">
          <div className="p-2 rounded-lg bg-[var(--grey-200)] border border-[var(--grey-500)] text-[var(--blue-link)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Ingest Stream (CFCFRMS / 1930)
              </h2>
              <span className="pill brand text-[9px] py-0 px-1.5">STREAM INTAKE</span>
            </div>
            <p className="text-[11px] text-[var(--grey-1000)] font-mono">
              Statutory citizen cyber complaint intake & automated spatial pipeline injection
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">INCIDENT ID</label>
              <input
                type="text"
                required
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              />
            </div>
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">PAYMENT RAIL</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              >
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">VICTIM ACCOUNT</label>
              <input
                type="text"
                required
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              />
            </div>
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">STOLEN AMOUNT (INR)</label>
              <input
                type="number"
                required
                min="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">VICTIM NAME</label>
              <input
                type="text"
                required
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              />
            </div>
            <div>
              <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">VICTIM PHONE</label>
              <input
                type="text"
                required
                value={victimPhone}
                onChange={(e) => setVictimPhone(e.target.value)}
                className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--grey-900)] block mb-1 uppercase text-[10px]">TRANSACTION UTR</label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full bg-[var(--grey-100)] border border-[var(--grey-700)] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[var(--blue-primary)]"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-[var(--grey-100)] text-[var(--emerald-primary)] border border-[var(--emerald-primary)]/40"
                  : "bg-[var(--grey-100)] text-[var(--red-primary)] border border-[var(--red-primary)]/40"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)] flex-shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-[var(--red-primary)] flex-shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--grey-700)]">
            <button
              type="button"
              onClick={onClose}
              className="btn light default"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn dark default text-white bg-[var(--blue-primary)] hover:bg-[var(--blue-link)]"
            >
              {isSubmitting ? "Validating & Ingesting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
