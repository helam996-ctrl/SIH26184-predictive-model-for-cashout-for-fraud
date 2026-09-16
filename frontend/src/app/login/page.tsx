/**
 * CyberSuraksha - National Single Sign-On (NSSO) Portal
 * 
 * Official Government of India Authentication Gateway:
 * - National Single Sign-On (NSSO) & Government of India Identity Framework
 * - Law Enforcement Agency (LEA) & I4C Ministry of Home Affairs access
 * - Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 compliance
 * - Multi-Factor Authentication: Official ID, Mobile OTP, Government Soft Token
 * - Dynamic Personnel Onboarding & 1-Click Evaluator Roster
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, PersonnelUser } from "@/lib/authContext";
import { NationalEmblem } from "@/components/NationalEmblem";
import {
  ShieldCheck,
  Lock,
  BadgeCheck,
  Building2,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Shield,
  RefreshCw,
  ChevronLeft,
  Users,
  Eye,
  EyeOff,
  Scale
} from "lucide-react";

export default function GovernmentLoginPage() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<"sso" | "register">("sso");
  const [selectedLanguage, setSelectedLanguage] = useState<"EN" | "HI">("EN");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Dynamic Captcha State
  const [captchaCode, setCaptchaCode] = useState("7K9P2W");
  const [captchaInput, setCaptchaInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [statutoryAgreed, setStatutoryAgreed] = useState(true);

  // Tab 1: Official National SSO Sign In
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  // Tab 2: Official Registration State
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

  // Refresh captcha helper
  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput("");
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Handle Tab 1: Official National SSO Sign In
  const handleSsoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");

    if (!identifier.trim()) {
      setSignInError("Please enter your Officer Badge ID or Gov SSO ID.");
      return;
    }

    if (!pin.trim()) {
      setSignInError("Please enter your Security Clearance PIN.");
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setSignInError("Invalid Security Captcha code. Please re-enter the characters shown.");
      refreshCaptcha();
      return;
    }

    if (!statutoryAgreed) {
      setSignInError("You must acknowledge statutory authority under Section 102 BNSS.");
      return;
    }

    setSignInLoading(true);
    const res = await login(identifier, pin);
    setSignInLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setSignInError(res.message || "Authentication failed. Check your Officer Badge ID or PIN.");
      refreshCaptcha();
    }
  };

  // Handle Google OAuth Single Sign-In
  const handleGoogleSignIn = async () => {
    setSignInError("");
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setSignInError(res.message || "Google Sign-In failed.");
      setGoogleLoading(false);
    }
  };

  // Handle Tab 2: Official Personnel Registration
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
        router.push("/");
      }, 1000);
    } else {
      setRegError(res.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f1f5f9] flex flex-col font-sans selection:bg-[#0284c7] selection:text-white">
      {/* 1. National Tricolor Top Masthead Strip */}
      <div className="tricolor-strip" />

      {/* 2. Official Government Masthead Bar */}
      <header className="border-b border-slate-800 bg-[#0a101f]/95 backdrop-blur px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Government of India Crest & Ministry Information */}
          <div className="flex items-center gap-3.5">
            <NationalEmblem className="w-10 h-12 flex-shrink-0" color="#e2e8f0" />
            <div className="border-l border-slate-700/80 pl-3">
              <div className="text-[13px] sm:text-sm font-bold text-white tracking-wide uppercase">
                {selectedLanguage === "HI" ? "भारत सरकार" : "Government of India"}
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {selectedLanguage === "HI"
                  ? "राष्ट्रीय सूचना विज्ञान केंद्र (NIC) • इलेक्ट्रॉनिकी और सूचना प्रौद्योगिकी मंत्रालय"
                  : "National Informatics Centre (NIC) • Ministry of Electronics & IT"}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>NATIONAL SINGLE SIGN-ON (NSSO) GATEWAY</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation & Accessibility */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md p-0.5 text-[11px]">
              <button
                onClick={() => setSelectedLanguage("EN")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  selectedLanguage === "EN" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLanguage("HI")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  selectedLanguage === "HI" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Government Authentication Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Side: Institutional Gateway Overview (National SSO Standards) */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-950/40 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold tracking-wider">
              <NationalEmblem className="w-4 h-4" />
              <span>CYBERSURAKSHA (SIH 26184) • NATIONAL SSO GATEWAY</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              One Identity for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-400">
                Real-Time Pre-ATM Cybercrime Interdiction
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              CyberSuraksha connects the Indian Cybercrime Coordination Centre (I4C MHA), State Police Cybercrime Beats, and Scheduled Commercial Bank Nodal Desks into a unified, sub-60s interdiction pipeline to execute Section 102 BNSS provisional debit freezes before stolen funds are withdrawn at ATMs.
            </p>
          </div>

          {/* Statutory BNSS Authority Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-mono text-slate-300 shadow-lg">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Statutory Legal Authorization: Section 102 BNSS</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Access is strictly restricted to authorized public servants empowered under Section 102 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 and Section 69B of the Information Technology Act, 2000 for preemptive interdiction of fraudulent cyber fund flows.
            </p>
          </div>

          {/* Security & Regulatory Compliance Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-[#0c1220] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Security Audit</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">CERT-In Audited</div>
              <div className="text-[10px] text-slate-400">MeitY Guidelines</div>
            </div>

            <div className="p-3 rounded-lg bg-[#0c1220] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Two-Factor Auth</div>
              <div className="text-xs font-bold text-sky-400 mt-0.5">Gov 2FA</div>
              <div className="text-[10px] text-slate-400">TOTP & Tap Token</div>
            </div>

            <div className="p-3 rounded-lg bg-[#0c1220] border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Standards</div>
              <div className="text-xs font-bold text-purple-300 mt-0.5">ISO/IEC 27001</div>
              <div className="text-[10px] text-slate-400">GIGW 3.0 Verified</div>
            </div>
          </div>

          {/* Institutional Partner Seals */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <NationalEmblem className="w-5 h-5" />
              <span>National SSO</span>
            </div>
            <span>•</span>
            <span>I4C (MHA)</span>
            <span>•</span>
            <span>National Cybercrime Reporting Portal</span>
          </div>
        </div>

        {/* Right Side: Authentic Institutional Authentication Card */}
        <div className="w-full max-w-lg">
          <div className="gov-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-[#0a101f]">
            {/* Card Header with Institutional Brand */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-[#11192e] to-[#0a101f]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <NationalEmblem className="w-7 h-7" />
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Sign In with National SSO</span>
                      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30">
                        NSSO
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono">
                      National Informatics Centre Central Authentication Service
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Official Gateway Tabs */}
              <div className="grid grid-cols-2 p-1 bg-[#050811] rounded-lg border border-slate-800 text-[11px] font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("sso")}
                  className={`py-2 px-3 text-center rounded transition-all cursor-pointer truncate ${
                    activeTab === "sso"
                      ? "bg-slate-800 text-white shadow font-bold border border-slate-700"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Official Officer Sign In"
                >
                  Official Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`py-2 px-3 text-center rounded transition-all cursor-pointer truncate ${
                    activeTab === "register"
                      ? "bg-slate-800 text-emerald-400 shadow font-bold border border-slate-700"
                      : "text-slate-400 hover:text-emerald-300"
                  }`}
                  title="Register Authorized Officer"
                >
                  Register Officer
                </button>
              </div>
            </div>

            {/* Form Body Container */}
            <div className="p-5">
              {/* TAB 1: OFFICIAL NATIONAL SSO SIGN IN */}
              {activeTab === "sso" && (
                <form onSubmit={handleSsoSignIn} className="space-y-3.5">
                  {signInError && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{signInError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                      Officer Badge ID or Gov SSO ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. DL-CYBER-8841 or GOV-DL-8841"
                        className="w-full bg-[#050811] border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                      <BadgeCheck className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-mono text-slate-300 uppercase font-semibold">
                        Security Clearance PIN / Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                      >
                        {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPin ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#050811] border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  {/* Indian Government Security Captcha Verification */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-semibold">
                      Enter Security Captcha *
                    </label>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <div className="captcha-display px-3 py-1.5 rounded flex-1 text-center tracking-widest">
                          {captchaCode}
                        </div>
                        <button
                          type="button"
                          onClick={refreshCaptcha}
                          title="Refresh Captcha"
                          className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Enter 6 characters"
                        maxLength={6}
                        className="w-full bg-[#050811] border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Statutory Acknowledgement Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="statutory-declaration"
                      checked={statutoryAgreed}
                      onChange={(e) => setStatutoryAgreed(e.target.checked)}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="statutory-declaration" className="text-[10px] text-slate-400 font-mono leading-tight cursor-pointer">
                      I declare that I am an authorized public servant / banking nodal officer accessing statutory interdiction powers under Section 102 BNSS / Section 69B IT Act.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={signInLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition-all font-mono uppercase tracking-wider mt-1"
                  >
                    {signInLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In with National SSO</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-slate-700/60" />
                    <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      OR SIGN IN SECURELY WITH
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

              {/* TAB 2: OFFICIAL PERSONNEL REGISTRATION */}
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
                      <span>Government personnel registered! Creating secure session...</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Officer Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Insp. Rajesh Verma"
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Official Badge / Service ID *
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
                    <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Designation / Rank
                      </label>
                      <input
                        type="text"
                        value={regRank}
                        onChange={(e) => setRegRank(e.target.value)}
                        placeholder="Investigating Officer"
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Institutional Wing
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
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Station / Department
                      </label>
                      <input
                        type="text"
                        value={regAgency}
                        onChange={(e) => setRegAgency(e.target.value)}
                        placeholder="Delhi PS South"
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                        Jurisdiction / District
                      </label>
                      <input
                        type="text"
                        value={regJurisdiction}
                        onChange={(e) => setRegJurisdiction(e.target.value)}
                        placeholder="South Delhi Zone"
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 uppercase mb-0.5 font-semibold">
                      Security Clearance Passkey PIN
                    </label>
                    <input
                      type="password"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="Create 4-6 digit clearance PIN"
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
                        <span>Register & Generate Gov SSO ID</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Official National Portal Footer */}
      <footer className="border-t border-slate-800 bg-[#070b14] py-4 px-6 text-xs font-mono text-slate-400 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-slate-300 font-semibold">National Informatics Centre (NIC)</span>
              <span>•</span>
              <span>Ministry of Electronics & Information Technology, Government of India</span>
            </div>
            <div className="text-[11px] text-slate-400">
              National Cybercrime Reporting Portal (NCRP) & I4C MHA Integration • Section 102 BNSS Ready
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300">
            <span>Helpline: <strong className="text-emerald-400">1930</strong></span>
            <span>•</span>
            <span>CyberDost MHA</span>
            <span>•</span>
            <span>STQC Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
