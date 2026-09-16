/**
 * CyberSuraksha - Official National Government & Institutional Footer
 * 
 * Production-grade institutional footer:
 * - National Informatics Centre (NIC) & Ministry of Home Affairs (I4C)
 * - Section 102 BNSS Statutory Compliance & Emergency Helpline 1930
 * - SIH26184 Prototype Attribution: "Made by Code Stark"
 */

"use client";

import React from "react";
import { ShieldCheck, Scale, PhoneCall } from "lucide-react";

export default function PersistentFooter() {
  return (
    <footer className="w-full bg-[#050811] border-t border-slate-800 text-slate-400 py-3 px-4 select-none font-mono text-[11px]">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-bold text-white">NATIONAL SSO (NSSO) INTEGRATED</span>
          <span>•</span>
          <span>GOVERNMENT OF INDIA</span>
          <span>•</span>
          <span className="text-sky-400">I4C (MHA) & NCRP TELEMETRY</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">SEC. 102 BNSS / FORM 91 COMPLIANT</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400 text-[10.5px]">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <PhoneCall className="w-3 h-3" />
            <span>Cybercrime Helpline: 1930</span>
          </div>
          <span>•</span>
          <span>NIC Cert-In Audited</span>
          <span>•</span>
          <span className="text-slate-300 font-medium">Made by Code Stark</span>
        </div>
      </div>
    </footer>
  );
}
