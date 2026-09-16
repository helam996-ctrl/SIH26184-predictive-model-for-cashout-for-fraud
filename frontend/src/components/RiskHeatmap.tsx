/**
 * CyberSuraksha - Risk Heatmap Dynamic Wrapper
 * 
 * Dynamically loads the Leaflet map client-side to prevent SSR window issues.
 * Subscribes to live feed alerts and coordinates marker selections.
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { EnrichedAlert, useLiveFeedContext } from "@/lib/liveFeedSimulator";

export interface RiskHeatmapProps {
  alerts?: EnrichedAlert[];
  selectedAlertId?: string | null;
  onSelectAlert?: (alertId: string) => void;
  onRecommendAction?: (alert: EnrichedAlert) => void;
}

const RiskHeatmapInnerDynamic = dynamic(() => import("./RiskHeatmapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[370px] rounded-xl border border-[var(--grey-700)] bg-[#0d111a] flex flex-col items-center justify-center gap-3 text-[var(--grey-1000)] font-mono relative">
      <div className="w-8 h-8 border-2 border-[#00d26a] border-t-transparent rounded-full animate-spin"></div>
      <div className="text-xs uppercase tracking-widest text-[#f1f5f9] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00d26a] animate-ping"></span>
        <span>Initializing South Delhi / NCR Spatial Risk Grid...</span>
      </div>
      <div className="text-[10px] text-[#64748b]">
        Plotting ATM Exit Corridors & Multi-hop Layering Telemetry
      </div>
    </div>
  )
});

export default function RiskHeatmap(props: RiskHeatmapProps) {
  // If alerts are passed explicitly via props, use them
  if (props.alerts) {
    return <RiskHeatmapInnerDynamic {...props} alerts={props.alerts} />;
  }

  // Otherwise, wrap in consumer hook
  return <RiskHeatmapWithContext {...props} />;
}

function RiskHeatmapWithContext(props: RiskHeatmapProps) {
  const { alerts, selectedAlertId, selectAlert } = useLiveFeedContext();

  return (
    <RiskHeatmapInnerDynamic
      alerts={alerts}
      selectedAlertId={props.selectedAlertId ?? selectedAlertId}
      onSelectAlert={props.onSelectAlert ?? selectAlert}
      onRecommendAction={props.onRecommendAction}
    />
  );
}
