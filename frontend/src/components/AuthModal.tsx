/**
 * CyberSuraksha - National SSO Personnel Authentication Modal
 * 
 * Official Government of India & NIC National SSO Modal:
 * - National Single Sign-On (Official ID & Mobile OTP)
 * - Officer Onboarding & Credential Generation
 * - Active Personnel & Registered Accounts Roster
 * - Full Section 102 BNSS statutory authorization markers
 */

"use client";

import React, { useState } from "react";
import { useAuth, DEMO_PROFILES, PersonnelUser } from "@/lib/authContext";
import { NationalEmblem } from "@/components/NationalEmblem";
import {
  ShieldCheck,
  BadgeCheck,
  Building2,
  X,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Users,
  UserCheck,
  Trash2,
  Lock
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultTab = "signin"
}: AuthModalProps) {
  const { login, register, loginWithGoogle, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "register">(defaultTab);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPin, setSignInPin] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regBadgeId, setRegBadgeId] = useState("");
  const [regRank, setRegRank] = useState("Investigating Officer");
  const [regAgency, setRegAgency] = useState("Delhi Police Cyber PS South");
  const [regAgencyType, setRegAgencyType] = useState<"lea" | "i4c" | "bank">("lea");
  const [regJurisdiction, setRegJurisdiction] = useState("South Delhi / NCR Zone");
  const [regPin, setRegPin] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    if (!signInIdentifier.trim()) {
      setSignInError("Please enter your Officer Badge ID or Gov SSO ID.");
      return;
    }
    if (!signInPin.trim()) {
      setSignInError("Please enter your Security Clearance PIN.");
      return;
    }

    setSignInLoading(true);
    const res = await login(signInIdentifier, signInPin);
    setSignInLoading(false);
    if (res.success) {
      onClose();
    } else {
      setSignInError(res.message || "Authentication failed. Check your Officer Badge ID or PIN.");
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError("");
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setSignInError(res.message || "Google Sign-In failed.");
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regName.trim() || !regEmail.trim() || !regBadgeId.trim()) {
      setRegError("Please fill in all mandatory personnel details.");
      return;
    }
    setRegLoading(true);
    const newOfficer: Omit<PersonnelUser, "id"> = {
      name: regName.trim(),
      email: regEmail.trim(),
      badgeId: regBadgeId.trim().toUpperCase(),
      rank: regRank,
      agency: regAgency,
      agencyType: regAgencyType,
      jurisdiction: regJurisdiction
    };
    const res = await register(newOfficer, regPin);
    setRegLoading(false);
    if (res.success) {
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        onClose();
      }, 1000);
    } else {
      setRegError(res.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#090d16] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* National Tricolor Top Strip */}
        <div className="tricolor-strip" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 bg-gradient-to-b from-[#0f172a] to-[#090d16]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NationalEmblem className="w-8 h-10 flex-shrink-0" color="#e2e8f0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    National SSO Gateway
                  </h2>
                  <span className="gov-badge-verified text-[10px]">
                    SECURE NSSO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Section 102 BNSS • Law Enforcement & Banking Coordination
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

          {/* 2 Tabs: Official ID & Register */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-[#050811] rounded-lg border border-slate-800 text-xs font-mono font-semibold">
            <button
              onClick={() => setActiveTab("signin")}
              className={`py-2 text-center rounded transition-all cursor-pointer truncate ${
                activeTab === "signin"
                  ? "bg-slate-800 text-white shadow font-bold border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Official Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-2 text-center rounded transition-all cursor-pointer truncate ${
                activeTab === "register"
                  ? "bg-slate-800 text-emerald-400 shadow font-bold border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register Officer
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: OFFICIAL SSO SIGN IN */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {signInError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{signInError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
                  Officer Badge ID or Gov SSO ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. DL-CYBER-8841 or GOV-DL-8841"
                    className="w-full bg-[#050811] border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <BadgeCheck className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
                  Security Clearance PIN / Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={signInPin}
                    onChange={(e) => setSignInPin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050811] border border-slate-700 focus:border-sky-500 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={signInLoading}
                className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition-all font-mono uppercase tracking-wider"
              >
                {signInLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate with National SSO</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-slate-700/60" />
                <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  OR SIGN IN WITH
                </span>
                <div className="flex-grow border-t border-slate-700/60" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer border border-slate-300 font-sans"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER NEW PERSONNEL */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              {regError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Registered successfully! Redirecting...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Officer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Insp. Rajesh Verma"
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Badge / Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={regBadgeId}
                    onChange={(e) => setRegBadgeId(e.target.value)}
                    placeholder="DL-CYBER-9912"
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                  Government / Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="r.verma@delhipolice.gov.in"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Sector
                  </label>
                  <select
                    value={regAgencyType}
                    onChange={(e) => setRegAgencyType(e.target.value as any)}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="lea">State Police Cyber PS (LEA)</option>
                    <option value="i4c">I4C National Command (MHA)</option>
                    <option value="bank">Nodal Bank Desk (FRM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                    Station / Department
                  </label>
                  <input
                    type="text"
                    value={regAgency}
                    onChange={(e) => setRegAgency(e.target.value)}
                    placeholder="Delhi Cyber PS South"
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                  Clearance PIN
                </label>
                <input
                  type="password"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="Create 4-6 digit passkey"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all font-mono uppercase tracking-wider mt-1"
              >
                {regLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Officer & Start Session</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
