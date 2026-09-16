/**
 * CyberSuraksha - Command Header (Kalshi Inspired)
 * 
 * High-precision institutional header with:
 * - Kalshi prediction market aesthetic (Obsidian/Slate, Kalshi green CTAs, hairline borders)
 * - Live Interdiction Telemetry & Ticker
 * - Officer / Personnel Authentication dropdown, Sign In & Register modal triggers
 * - Multi-Agency persona quick switcher
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  Clock,
  Zap,
  Building2,
  Compass,
  BadgeCheck,
  Lock,
  Play,
  Pause,
  SkipForward,
  Activity,
  User,
  LogOut,
  ChevronDown,
  UserPlus,
  LogIn,
  Search,
  Users,
  ShieldCheck
} from "lucide-react";
import { TelemetryStats } from "@/lib/api";
import { useLiveFeedContext, EnrichedAlert } from "@/lib/liveFeedSimulator";
import { SYNTHETIC_DATA_BADGE } from "@/lib/mockDataset";
import { useAuth, DEMO_PROFILES } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import { NationalEmblem } from "@/components/NationalEmblem";
import PersonnelDirectoryModal from "@/components/PersonnelDirectoryModal";

interface Props {
  telemetry: TelemetryStats | null;
  activePersona: "i4c" | "lea" | "bank";
  onSelectPersona: (p: "i4c" | "lea" | "bank") => void;
  operationalWindowMins: number;
}

export default function CommandHeader({
  telemetry,
  activePersona,
  onSelectPersona,
  operationalWindowMins
}: Props) {
  const [istTime, setIstTime] = useState<string>("");
  const { user, isAuthenticated, logout, quickLogin, allAccounts, switchAccount } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "register">("signin");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPersonnelDirectoryOpen, setIsPersonnelDirectoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Connect to live feed simulator state
  let feedState: {
    isLive: boolean;
    secondsSinceLastUpdate: number;
    toggleLive: () => void;
    triggerNext: () => EnrichedAlert | null;
  } = {
    isLive: true,
    secondsSinceLastUpdate: 0,
    toggleLive: () => {},
    triggerNext: () => null
  };

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const context = useLiveFeedContext();
    if (context) {
      feedState = context;
    }
  } catch {
    // Fallback if rendered outside provider
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setIstTime(`${timeStr} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openAuth = (tab: "signin" | "register") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsProfileDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-[#07090e] border-b border-[rgba(255,255,255,0.08)] select-none">
        {/* Official Indian National Tricolor Strip */}
        <div className="tricolor-strip" />

        {/* 1. MANDATORY DESIGNED SYNTHETIC DATA NOTICE STRIP */}
        <div className="bg-amber-950/20 border-b border-amber-500/20 px-4 py-1 text-[10px] font-mono text-amber-300/90 flex items-center justify-between gap-4">
          <div className="max-w-[1720px] mx-auto w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
              <span className="font-semibold tracking-wide">
                {SYNTHETIC_DATA_BADGE}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[9.5px] text-[#94a3b8]">
              <span>SIH26184 Prototype • Decision Support</span>
              <span>•</span>
              <span className="text-[#00d26a] font-bold">SEC. 102 BNSS / FORM 91 COMPLIANT</span>
            </div>
          </div>
        </div>

        {/* 2. INSTITUTIONAL CONTROL & STATUS BAR */}
        <div className="bg-[#0d111a] border-b border-[rgba(255,255,255,0.07)] px-4 py-2 text-xs font-mono">
          <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Left: Officer Identification & Fast Persona Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Authenticated Officer Pill / Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 bg-[#131926] hover:bg-[#1a2233] px-3 py-1 rounded-lg border border-[rgba(255,255,255,0.1)] text-left transition-all cursor-pointer group"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#00d26a]/20 border border-[#00d26a]/40 flex items-center justify-center text-[#00d26a]">
                      <BadgeCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-white font-bold text-xs flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <span className="text-[10px] text-[#00d26a] font-normal">({user.badgeId})</span>
                      </div>
                      <div className="text-[9.5px] text-[#94a3b8] truncate max-w-[210px]">
                        {user.agency}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#64748b] group-hover:text-white transition-colors ml-1" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAuth("signin")}
                      className="px-3 py-1 rounded-lg bg-[#131926] hover:bg-[#1a2233] text-white border border-[rgba(255,255,255,0.1)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#00d26a]" />
                      <span>OFFICER SIGN IN</span>
                    </button>
                    <button
                      onClick={() => openAuth("register")}
                      className="kalshi-btn-yes px-3 py-1 text-xs cursor-pointer flex items-center gap-1.5 font-bold"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>REGISTER</span>
                    </button>
                  </div>
                )}

                {/* Profile Popover Menu */}
                {isProfileDropdownOpen && user && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                    <div className="border-b border-slate-800 pb-2.5 mb-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate max-w-[170px]">{user.name}</div>
                        <span className="gov-badge-verified text-[9px]">NATIONAL SSO</span>
                      </div>
                      <div className="text-[10.5px] text-[#00d26a] font-mono mt-0.5">{user.rank}</div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">{user.email}</div>
                      <div className="text-[10px] text-sky-400 font-mono mt-0.5 font-semibold">
                        {user.govSsoId || `GOV-${user.badgeId}`}
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">
                        {user.jurisdiction} • Level-3 BNSS Clearance
                      </div>
                    </div>

                    {/* Authorized Officer Credential Summary Card */}
                    <div className="bg-[#080d1a] border border-slate-800 rounded-lg p-2.5 mb-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[9px] uppercase font-mono text-slate-400 tracking-wider">
                        <span>Authorized Personnel</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          AUTHENTICATED
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{user.badgeId} • {user.agency}</div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[9.5px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-500">CLEARANCE:</span> Level-3 BNSS
                        </div>
                        <div>
                          <span className="text-slate-500">MFA:</span> Token + OTP
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setIsPersonnelDirectoryOpen(true);
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-sky-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>View Authorized Personnel Dossier</span>
                      </button>
                      <Link
                        href="/login"
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Government SSO Gateway Page</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-[#ff4557] hover:bg-[#ff4557]/10 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Terminal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[#1e2638] hidden sm:inline">•</span>

              {/* Live Feed Status & Time Elapsed */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131926] border border-[rgba(255,255,255,0.08)]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      feedState.isLive ? "bg-[#00d26a] animate-ping" : "bg-amber-400"
                    }`}
                  />
                  <span className="font-bold text-white text-[11px]">
                    {feedState.isLive ? "LIVE FEED" : "PAUSED"}
                  </span>
                  <span className="text-[#94a3b8] text-[10px]">
                    • {feedState.secondsSinceLastUpdate}s ago
                  </span>
                </div>

                {/* Feed Controls */}
                <button
                  onClick={feedState.toggleLive}
                  title={feedState.isLive ? "Pause simulation feed" : "Resume simulation feed"}
                  className="p-1.5 rounded-lg bg-[#131926] hover:bg-[#1b2436] text-[#cbd5e1] hover:text-white border border-[rgba(255,255,255,0.08)] cursor-pointer"
                >
                  {feedState.isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>

                <button
                  onClick={() => feedState.triggerNext()}
                  title="Trigger next simulated complaint from PaySim"
                  className="p-1.5 rounded-lg bg-[#131926] hover:bg-[#1b2436] text-[#38bdf8] hover:text-white border border-[rgba(255,255,255,0.08)] cursor-pointer"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right: Real-Time Sync Clock & Link to Full Auth */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider hidden sm:inline">SYNC CLOCK:</span>
                <div className="px-2.5 py-1 rounded-lg bg-[#131926] border border-[rgba(255,255,255,0.08)] text-[#38bdf8] font-bold text-xs tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a9e5] animate-ping"></span>
                  <span>{istTime || "18:30:00 IST"}</span>
                </div>
              </div>

              <Link
                href="/login"
                className="text-[11px] font-mono text-[#94a3b8] hover:text-[#00d26a] transition-colors hidden md:flex items-center gap-1"
              >
                <span>Personnel Portal</span>
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Main Command & Telemetry Bar (Kalshi Refined) */}
        <div className="px-4 py-3 bg-[#07090e]">
          <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            {/* Brand Mark & Institutional Mandate */}
            <div className="flex items-center gap-3.5">
              <NationalEmblem className="w-8 h-10 flex-shrink-0" color="#e2e8f0" />
              <div className="flex-shrink-0">
                <svg width="30" height="23" viewBox="0 0 49 19.2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M23.2921 19.1117H1.44915C0.327385 19.1117 -0.369361 17.5162 0.208938 16.269L7.32271 0.90577C7.58051 0.341406 8.0543 0 8.56292 0H23.2991V19.1117H23.2921Z"
                    fill="#FF4557"
                  />
                  <path
                    d="M25.8008 0H47.6507C48.7725 0 49.4692 1.59555 48.8909 2.84272L41.7772 18.206C41.5194 18.7703 41.0456 19.1117 40.537 19.1117H25.8008V0Z"
                    fill="#00D26A"
                  />
                </svg>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    CYBER<span className="text-[#00d26a]">SURAKSHA</span>
                  </h1>
                  <span className="gov-badge-verified text-[9.5px]">
                    NATIONAL SSO
                  </span>
                  <span className="kalshi-badge bg-[#141a26] text-[#94a3b8] border border-[rgba(255,255,255,0.08)] text-[10px] hidden sm:inline-flex">
                    SEC. 102 BNSS STATUTORY HOLD
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono flex items-center gap-2 mt-0.5">
                  <span>Ministry of Home Affairs / I4C Command</span>
                  <span>•</span>
                  <span>National Cybercrime Reporting Portal</span>
                </p>
              </div>
            </div>

            {/* Telemetry Strip (Kalshi Trading Floor Ticker) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full xl:w-auto">
              {/* Coordination Latency */}
              <div className="kalshi-card p-2.5 flex items-center gap-2.5 min-w-[155px]">
                <div className="p-1.5 rounded-lg bg-[#141a26] border border-[rgba(255,255,255,0.08)] text-[#38bdf8]">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9.5px] uppercase font-mono text-[#64748b] tracking-wider">Coordination Latency</div>
                  <div className="text-sm font-bold font-mono text-[#38bdf8] flex items-center gap-1">
                    <span>{telemetry ? `${telemetry.coordination_latency_seconds}s` : "42.8s"}</span>
                    <span className="text-[10px] font-normal text-[#00d26a]">(-98.9%)</span>
                  </div>
                </div>
              </div>

              {/* Pre-ATM Interdiction Window */}
              <div className="kalshi-card p-2.5 flex items-center gap-2.5 min-w-[155px]">
                <div className="p-1.5 rounded-lg bg-[#141a26] border border-[rgba(255,255,255,0.08)] text-[#ff4557]">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9.5px] uppercase font-mono text-[#64748b] tracking-wider">Interdiction Window</div>
                  <div className="text-sm font-bold font-mono text-[#ff4557] flex items-center gap-1">
                    <span>{operationalWindowMins}m 00s</span>
                    <span className="text-[10px] font-normal text-amber-400">Pre-ATM</span>
                  </div>
                </div>
              </div>

              {/* Funds Intercepted */}
              <div className="kalshi-card p-2.5 flex items-center gap-2.5 min-w-[155px]">
                <div className="p-1.5 rounded-lg bg-[#141a26] border border-[rgba(255,255,255,0.08)] text-[#00d26a]">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9.5px] uppercase font-mono text-[#64748b] tracking-wider">Funds Intercepted</div>
                  <div className="text-sm font-bold font-mono text-[#00d26a]">
                    ₹{telemetry ? (telemetry.stolen_funds_intercepted_today_inr / 100000).toFixed(1) : "48.7"}L
                  </div>
                </div>
              </div>

              {/* Recommended Holds */}
              <div className="kalshi-card p-2.5 flex items-center gap-2.5 min-w-[155px]">
                <div className="p-1.5 rounded-lg bg-[#141a26] border border-[rgba(255,255,255,0.08)] text-amber-400">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9.5px] uppercase font-mono text-[#64748b] tracking-wider">Recommended Holds</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {telemetry ? telemetry.total_terminal_accounts_frozen : 18} Accounts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      {/* Official Personnel & Registered Credentials Directory Modal */}
      <PersonnelDirectoryModal
        isOpen={isPersonnelDirectoryOpen}
        onClose={() => setIsPersonnelDirectoryOpen(false)}
        onOpenRegister={() => openAuth("register")}
      />
    </>
  );
}
