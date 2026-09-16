"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ATMNode } from "@/lib/api";

interface Props {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  candidateAtms: ATMNode[];
  threshold: number;
  selectedAtm: ATMNode | null;
  onSelectAtm: (atm: ATMNode) => void;
  onOpenDispatch: (atm: ATMNode) => void;
}

const ThreatMapDynamic = dynamic(() => import("./ThreatMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl border border-[var(--grey-700)] bg-[var(--grey-100)] flex flex-col items-center justify-center gap-3 text-[var(--grey-1000)] font-mono relative">
      <span className="tick" style={{ "--x": "0%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "0%" } as any}>+</span>
      <span className="tick" style={{ "--x": "0%", "--y": "100%" } as any}>+</span>
      <span className="tick" style={{ "--x": "100%", "--y": "100%" } as any}>+</span>
      <div className="w-9 h-9 border-2 border-[var(--blue-link)] border-t-transparent rounded-full animate-spin"></div>
      <div className="text-xs uppercase tracking-widest text-[var(--grey-1300)] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--blue-primary)] animate-ping"></span>
        <span>Loading GIS Threat Feed & PostGIS Nodes...</span>
      </div>
    </div>
  ),
});

export default function ThreatMap(props: Props) {
  return <ThreatMapDynamic {...props} />;
}
