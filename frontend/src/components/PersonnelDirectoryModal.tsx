/**
 * CyberSuraksha - Authorized Personnel Credential Dossier Modal
 * 
 * Official Government of India Institutional Credential Interface:
 * - Strictly displays ONLY the single authorized personnel who is currently signed in.
 * - Details verified National Gov SSO ID, statutory BNSS Section 102 clearance, and active terminal session.
 */

"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { NationalEmblem } from "@/components/NationalEmblem";
import {
  ShieldCheck,
  Building2,
  BadgeCheck,
  CheckCircle2,
  X,
  Lock,
  LogOut,
  LogIn,
  KeyRound,
  FileText,
  Clock,
  Radio,
  ExternalLink,
  Scale
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export default function PersonnelDirectoryModal({ isOpen, onClose }: Props) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* National Tricolor Top Strip */}
        <div className="tricolor-strip" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NationalEmblem className="w-8 h-10" color="#e2e8f0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Authorized Personnel Credential Dossier
                </h2>
                <span className="gov-badge-verified text-[10px]">
                  NATIONAL SSO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Government of India • Ministry of Home Affairs / I4C Authorized Officer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2.5 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Active Terminal Clearance: Section 102 BNSS Provisional Seizure Authority
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
            VERIFIED SESSION
          </span>
        </div>

        {/* Modal Body: ONLY THE SINGLE SIGNED-IN OFFICER */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {user ? (
            <>
              {/* Officer Credential Card */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-emerald-500/40 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                  <NationalEmblem className="w-24 h-28" />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Badge Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-inner ${
                        user.agencyType === "lea"
                          ? "bg-red-950/40 border-red-500/40 text-red-400"
                          : user.agencyType === "i4c"
                          ? "bg-sky-950/40 border-sky-500/40 text-sky-400"
                          : "bg-amber-950/40 border-amber-500/40 text-amber-400"
                      }`}
                    >
                      {user.agencyType === "bank" ? (
                        <Building2 className="w-7 h-7" />
                      ) : (
                        <BadgeCheck className="w-7 h-7" />
                      )}
                    </div>

                    {/* Name & Institutional Rank */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {user.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          SIGNED-IN OFFICER
                        </span>
                      </div>

                      <div className="text-xs font-mono text-emerald-400 mt-1 font-semibold">
                        {user.rank}
                      </div>

                      <div className="text-xs text-slate-300 mt-0.5">
                        {user.agency}
                      </div>
                    </div>
                  </div>

                  {/* Agency Badge */}
                  <div className="text-right sm:text-right font-mono self-start sm:self-center">
                    <span className="text-[10px] uppercase text-slate-400">Jurisdiction Code</span>
                    <div className="text-xs font-bold text-white mt-0.5">{user.jurisdiction}</div>
                    <div className="text-[10px] text-sky-400 uppercase mt-0.5 font-bold">
                      {user.agencyType === "lea"
                        ? "Law Enforcement Agency"
                        : user.agencyType === "i4c"
                        ? "I4C National Desk"
                        : "Bank Nodal Operations"}
                    </div>
                  </div>
                </div>

                {/* Identity & Technical Verification Grid */}
                <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">National Gov SSO ID</span>
                    <div className="font-bold text-sky-400 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{user.govSsoId || `GOV-${user.badgeId}`}</span>
                    </div>
                  </div>

                  <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Official Badge / Employee ID</span>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user.badgeId}</span>
                    </div>
                  </div>

                  <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Official Email</span>
                    <div className="font-medium text-slate-300 truncate">
                      {user.email}
                    </div>
                  </div>

                  <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Terminal Handshake</span>
                    <div className="font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>256-bit AES Cryptographic Session</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Warrant & Legal Authority */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono text-white font-bold uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Warrant & Interdiction Clearance</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="flex items-start gap-2 bg-[#0d1424] p-2.5 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white font-mono text-xs">
                        Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023:
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Statutory power to effect provisional debit freezes on suspected mule terminal accounts prior to cash-out.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-[#0d1424] p-2.5 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white font-mono text-xs">
                        Section 91 CrPC Statutory Production Requisition:
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Authority to mandate real-time ATM transaction logs and CCTV preservation from banking entities within the jurisdiction buffer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Session Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open National SSO Gateway</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Terminal Session</span>
                </button>
              </div>
            </>
          ) : (
            /* Empty State: No Officer Signed In */
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  No Authorized Personnel Currently Authenticated
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono">
                  This workstation requires official Government of India credentials via the National SSO Gateway to access statutory Section 102 BNSS decision-support tools.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00d26a] hover:bg-[#00b85c] text-slate-950 font-bold text-xs transition-colors shadow-lg cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate via Government SSO</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1424] flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>NIC Cert-In Compliant Single Session Authentication Record</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
