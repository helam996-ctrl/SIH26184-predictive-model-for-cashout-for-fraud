/**
 * CyberSuraksha - Risk Heatmap Inner Component (Client Side Leaflet)
 * 
 * Plots ATM / Bank cash-withdrawal corridors across South Delhi/NCR.
 * Kalshi-styled high precision predictive spatial grid:
 * - Medium default height (370px) to prevent screen dominance
 * - Multi-stage size controls: Compact (270px), Medium (370px), Large (520px), Fullscreen Maximize
 * - Dynamic Leaflet tile invalidation on resize
 * - Escape key to exit fullscreen
 * - Color-coded markers: Green (<40), Yellow (40-70), Red (>70)
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { EnrichedAlert } from "@/lib/liveFeedSimulator";
import { CrimeCategory, BANK_NAME_DISCLAIMER } from "@/lib/mockDataset";
import {
  ShieldAlert,
  AlertTriangle,
  Building2,
  Clock,
  ArrowRight,
  Filter,
  Sliders,
  X,
  Compass,
  DollarSign,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Activity,
  Layers,
  Crosshair,
  MapPin,
  Navigation,
  Radio,
  Car,
  Footprints,
  ShieldCheck,
  Send
} from "lucide-react";

interface RiskHeatmapInnerProps {
  alerts: EnrichedAlert[];
  selectedAlertId?: string | null;
  onSelectAlert?: (alertId: string) => void;
  onRecommendAction?: (alert: EnrichedAlert) => void;
}

type MapSizeMode = "compact" | "medium" | "large" | "fullscreen";

// Haversine Distance Formula
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// South Delhi / NCR Landmark Dictionary for Locality Resolution
const NCR_LANDMARKS = [
  { name: "Nehru Place Financial District", lat: 28.5482, lon: 77.2513 },
  { name: "Kalkaji Commercial Hub", lat: 28.5412, lon: 77.2589 },
  { name: "Saket District Centre", lat: 28.5284, lon: 77.2185 },
  { name: "Greater Kailash I M-Block", lat: 28.5539, lon: 77.2405 },
  { name: "Hauz Khas Commercial Sector", lat: 28.5494, lon: 77.2001 },
  { name: "Lajpat Nagar Central Market", lat: 28.5700, lon: 77.2440 },
  { name: "South Extension Ring Road", lat: 28.5729, lon: 77.2223 },
  { name: "Okhla Industrial Area Phase III", lat: 28.5355, lon: 77.2740 },
  { name: "Malviya Nagar Main Market", lat: 28.5398, lon: 77.2104 },
  { name: "Connaught Place Financial Ring", lat: 28.6315, lon: 77.2167 },
  { name: "Karol Bagh Commercial Zone", lat: 28.6514, lon: 77.1907 },
  { name: "Dwarka Sector 6 Banking Strip", lat: 28.5833, lon: 77.0667 },
  { name: "Noida Sector 18 Commercial Hub", lat: 28.5708, lon: 77.3261 },
  { name: "Cyber City DLF Phase II", lat: 28.4950, lon: 77.0890 }
];

function resolveLocality(lat: number, lon: number): string {
  let closest = NCR_LANDMARKS[0];
  let minDistance = Infinity;

  for (const lm of NCR_LANDMARKS) {
    const dist = getHaversineDistanceKm(lat, lon, lm.lat, lm.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = lm;
    }
  }

  if (minDistance < 0.6) {
    return closest.name;
  }
  return `Near ${closest.name} (${minDistance.toFixed(1)}km buffer)`;
}

// Smooth pan/zoom controller
function MapRecenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Map resize observer to invalidate Leaflet container dimensions smoothly
function MapResizeController({ sizeMode }: { sizeMode: MapSizeMode }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [sizeMode, map]);
  return null;
}

// Pinpoint Map Click Controller
function MapPinpointController({
  onPinpoint
}: {
  onPinpoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPinpoint(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Pinpoint Marker Icon Generator
function createPinpointMarkerIcon() {
  return L.divIcon({
    className: "scout-pinpoint-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 64px; height: 64px;">
        <div style="position: absolute; width: 56px; height: 56px; border-radius: 50%; background: rgba(56, 189, 248, 0.25); border: 2px solid #38bdf8; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(56, 189, 248, 0.3); border: 1.5px dashed #00d26a;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #00d26a; border: 3px solid #07090e; color: #07090e; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; box-shadow: 0 0 16px #00d26a;">
          📍
        </div>
        <div style="position: absolute; bottom: -2px; background: rgba(7, 9, 14, 0.95); border: 1px solid #38bdf8; border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: 800; color: #38bdf8; font-family: monospace; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          SCOUT PIN
        </div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32]
  });
}

// Custom Leaflet DivIcon generator matching Kalshi aesthetic
function createAtmMarkerIcon(score: number, bankName: string) {
  let color = "#00d26a"; // Kalshi Green <40
  let bgRgba = "rgba(0, 210, 106, 0.25)";
  let borderColor = "#00d26a";
  let pulseHtml = "";

  if (score > 70) {
    color = "#ff4557"; // Kalshi Red >70
    bgRgba = "rgba(255, 69, 87, 0.35)";
    borderColor = "#ff4557";
    pulseHtml = `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 69, 87, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`;
  } else if (score >= 40) {
    color = "#f59e0b"; // Yellow 40-70
    bgRgba = "rgba(245, 158, 11, 0.3)";
    borderColor = "#f59e0b";
  }

  const bankInitial = bankName.slice(0, 3).toUpperCase();

  return L.divIcon({
    className: "atm-risk-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer;">
        ${pulseHtml}
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${bgRgba}; border: 2px solid ${borderColor}; backdrop-filter: blur(4px);"></div>
        <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: ${color}; color: #07090e; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; font-family: var(--font-geist-mono), monospace; box-shadow: 0 0 12px ${color};">
          ${score}
        </div>
        <div style="position: absolute; bottom: -8px; background: rgba(13, 17, 26, 0.95); border: 1px solid ${borderColor}; border-radius: 4px; padding: 0 4px; font-size: 8px; font-weight: 700; color: #ffffff; font-family: var(--font-geist-mono), monospace; white-space: nowrap;">
          ${bankInitial}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

export default function RiskHeatmapInner({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onRecommendAction
}: RiskHeatmapInnerProps) {
  // Default map center: South Delhi / NCR core corridor
  const defaultCenter: [number, number] = [28.5355, 77.2410];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Map Size State: Default is "medium" (370px)
  const [sizeMode, setSizeMode] = useState<MapSizeMode>("medium");

  // Filter states
  const [minThreshold, setMinThreshold] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [timeFilterHours, setTimeFilterHours] = useState<number>(24);

  // Local active selected alert for the side panel
  const [activeSidePanelAlert, setActiveSidePanelAlert] = useState<EnrichedAlert | null>(null);

  // Pinpoint Scout State
  const [isPinpointMode, setIsPinpointMode] = useState<boolean>(false);
  const [pinpoint, setPinpoint] = useState<{ lat: number; lng: number; locality: string } | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  // Keyboard shortcut to exit fullscreen with ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sizeMode === "fullscreen") {
        setSizeMode("medium");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sizeMode]);

  // Sync external selectedAlertId if passed
  useEffect(() => {
    if (selectedAlertId) {
      const found = alerts.find((a) => a.id === selectedAlertId);
      if (found) {
        setActiveSidePanelAlert(found);
        setMapCenter([found.complaint.targetAtm.latitude, found.complaint.targetAtm.longitude]);
        setMapZoom(14);
      }
    }
  }, [selectedAlertId, alerts]);

  // Handle map click to drop or move pinpoint
  const handleMapPinpoint = (lat: number, lng: number) => {
    const locality = resolveLocality(lat, lng);
    setPinpoint({ lat, lng, locality });
    setDispatchNotice(null);
  };

  // Compute nearby ATMs from the pinpoint location
  const nearbyAtmsAnalysis = useMemo(() => {
    if (!pinpoint) return [];

    const atmMap = new Map<
      string,
      {
        atmId: string;
        bankName: string;
        address: string;
        latitude: number;
        longitude: number;
        distanceKm: number;
        distanceMeters: number;
        walkMinutes: number;
        bikeMinutes: number;
        riskScore: number;
        alertId: string;
        crimeCategory: string;
        stolenAmount: number;
      }
    >();

    for (const alert of alerts) {
      const atm = alert.complaint.targetAtm;
      if (!atmMap.has(atm.atmId)) {
        const distKm = getHaversineDistanceKm(pinpoint.lat, pinpoint.lng, atm.latitude, atm.longitude);
        const distMeters = Math.round(distKm * 1000);
        const walkMin = Math.max(1, Math.round((distKm / 4.5) * 60));
        const bikeMin = Math.max(1, Math.round((distKm / 20) * 60));

        atmMap.set(atm.atmId, {
          atmId: atm.atmId,
          bankName: atm.bankName,
          address: atm.address,
          latitude: atm.latitude,
          longitude: atm.longitude,
          distanceKm: distKm,
          distanceMeters: distMeters,
          walkMinutes: walkMin,
          bikeMinutes: bikeMin,
          riskScore: alert.assessment.compositeScore,
          alertId: alert.id,
          crimeCategory: alert.complaint.crimeCategory,
          stolenAmount: alert.complaint.stolenAmount
        });
      }
    }

    return Array.from(atmMap.values())
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [pinpoint, alerts]);

  // Live Prediction from Pinpoint
  const pinpointPrediction = useMemo(() => {
    if (!pinpoint || nearbyAtmsAnalysis.length === 0) return null;

    const nearest = nearbyAtmsAnalysis[0];
    let exitProbability = 45;
    let threatLevel = "MODERATE WATCH";

    if (nearest.distanceKm < 0.4) {
      exitProbability = Math.min(97, Math.max(85, nearest.riskScore + 8));
      threatLevel = "CRITICAL CASH-OUT RISK";
    } else if (nearest.distanceKm < 1.0) {
      exitProbability = Math.min(88, Math.max(70, nearest.riskScore + 2));
      threatLevel = "ELEVATED INTERDICTION WINDOW";
    } else if (nearest.distanceKm < 2.2) {
      exitProbability = Math.min(72, Math.max(48, nearest.riskScore - 10));
      threatLevel = "ELEVATED MONITORING";
    } else {
      exitProbability = Math.max(25, Math.min(50, nearest.riskScore - 25));
      threatLevel = "PERIPHERAL BUFFER";
    }

    const arrivalEtaMinutes = Math.max(2, Math.round(nearest.bikeMinutes + 1));
    const interdictionBufferMeters = nearest.distanceKm < 1 ? 800 : 1500;

    return {
      nearestAtm: nearest,
      exitProbability,
      threatLevel,
      arrivalEtaMinutes,
      interdictionBufferMeters,
      recommendedAction:
        nearest.distanceKm < 0.8
          ? `Immediate QRT Beat Patrol interdiction recommended at ${nearest.bankName} (${nearest.atmId}). Intercept within ${nearest.walkMinutes}m foot perimeter.`
          : `Issue Form 91 Pre-emptive Freeze Notice to ${nearest.bankName} Nodal Desk under Section 102 BNSS.`
    };
  }, [pinpoint, nearbyAtmsAnalysis]);

  // Aggregate and filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (alert.assessment.compositeScore < minThreshold) return false;
      if (selectedCategory !== "ALL" && alert.complaint.crimeCategory !== selectedCategory) {
        return false;
      }
      if (timeFilterHours !== 24) {
        const maxMinutes = timeFilterHours * 60;
        if (alert.complaint.reportedMinutesAgo > maxMinutes) return false;
      }
      return true;
    });
  }, [alerts, minThreshold, selectedCategory, timeFilterHours]);

  const crimeCategories: ("ALL" | CrimeCategory)[] = [
    "ALL",
    "Digital Arrest",
    "Investment Scam",
    "Job Task Fraud",
    "SIM Swap",
    "Loan App Extortion"
  ];

  const totalCapitalAtRisk = useMemo(() => {
    return filteredAlerts.reduce((acc, a) => acc + a.complaint.stolenAmount, 0);
  }, [filteredAlerts]);

  const criticalCount = useMemo(() => {
    return filteredAlerts.filter((a) => a.assessment.compositeScore > 70).length;
  }, [filteredAlerts]);

  const handleMarkerClick = (alert: EnrichedAlert) => {
    setActiveSidePanelAlert(alert);
    setMapCenter([alert.complaint.targetAtm.latitude, alert.complaint.targetAtm.longitude]);
    setMapZoom(14);
    if (onSelectAlert) {
      onSelectAlert(alert.id);
    }
  };

  // Height and container classes
  const canvasHeight =
    sizeMode === "compact"
      ? "h-[270px]"
      : sizeMode === "medium"
      ? "h-[370px]"
      : sizeMode === "large"
      ? "h-[520px]"
      : "flex-1 w-full min-h-0";

  const containerClass =
    sizeMode === "fullscreen"
      ? "fixed inset-0 z-50 w-screen h-screen bg-[#07090e] p-4 flex flex-col overflow-hidden animate-in fade-in duration-200"
      : "relative w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#07090e] overflow-hidden shadow-2xl flex flex-col transition-all duration-300";

  return (
    <div className={containerClass}>
      {/* FULLSCREEN ESCAPE NOTICE BADGE */}
      {sizeMode === "fullscreen" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#0d111a]/95 backdrop-blur-md border border-[#00d26a]/40 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 text-xs font-mono text-white">
          <span className="w-2 h-2 rounded-full bg-[#00d26a] animate-ping" />
          <span className="font-bold tracking-wider">FULLSCREEN SPATIAL EXIT RADAR</span>
          <span className="text-[#64748b]">|</span>
          <button
            onClick={() => setSizeMode("medium")}
            className="text-xs text-[#ff4557] hover:underline font-bold cursor-pointer flex items-center gap-1"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen [ESC]</span>
          </button>
        </div>
      )}

      {/* 1. TOP INTERACTIVE TOOLBAR & RESIZE CONTROLS */}
      <div className="p-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0d111a] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Threshold Slider */}
          <div className="flex items-center gap-2.5 bg-[#131926] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
            <Sliders className="w-3.5 h-3.5 text-[#00d26a]" />
            <span className="text-xs font-mono font-medium text-[#94a3b8]">
              Risk: <span className="text-white font-bold">{minThreshold}</span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              className="w-20 h-1.5 bg-[#242f47] rounded-lg appearance-none cursor-pointer accent-[#00d26a]"
            />
          </div>

          {/* Crime Category Dropdown */}
          <div className="flex items-center gap-2 bg-[#131926] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
            <Filter className="w-3.5 h-3.5 text-[#38bdf8]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-sans text-white focus:outline-none cursor-pointer"
            >
              {crimeCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#131926] text-white">
                  {cat === "ALL" ? "All Modalities" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center gap-2 bg-[#131926] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
            <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
            <select
              value={timeFilterHours}
              onChange={(e) => setTimeFilterHours(Number(e.target.value))}
              className="bg-transparent text-xs font-sans text-white focus:outline-none cursor-pointer"
            >
              <option value={1} className="bg-[#131926] text-white">Last 1h</option>
              <option value={3} className="bg-[#131926] text-white">Last 3h</option>
              <option value={6} className="bg-[#131926] text-white">Last 6h</option>
              <option value={24} className="bg-[#131926] text-white">24h Window</option>
            </select>
          </div>
        </div>

        {/* Right: Map Size Controls & Telemetry Chips */}
        <div className="flex items-center gap-2.5">
          {/* Pinpoint Scout Mode Toggle */}
          <button
            onClick={() => {
              const nextMode = !isPinpointMode;
              setIsPinpointMode(nextMode);
              if (nextMode && !pinpoint) {
                // Drop initial pin at current map center
                handleMapPinpoint(mapCenter[0], mapCenter[1]);
              }
            }}
            title="Click anywhere on the map to pin point, view nearby ATMs, and compute live cash-out prediction"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isPinpointMode || pinpoint
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-md shadow-sky-500/10"
                : "bg-[#131926] text-[#94a3b8] hover:text-white border border-[rgba(255,255,255,0.08)]"
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isPinpointMode || pinpoint ? "text-sky-400 animate-spin" : "text-[#94a3b8]"}`} />
            <span>{pinpoint ? "📍 Scout Pin Active" : "📍 Pinpoint Scout"}</span>
          </button>

          {/* Sizing Pills (Compact | Medium | Large | Fullscreen) */}
          <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
            <button
              onClick={() => setSizeMode("compact")}
              title="Compact View (270px)"
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                sizeMode === "compact"
                  ? "bg-[#1f293d] text-white font-bold shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setSizeMode("medium")}
              title="Medium View (370px) - Balanced Standard"
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                sizeMode === "medium"
                  ? "bg-[#00d26a] text-black font-bold shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSizeMode("large")}
              title="Large View (520px)"
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                sizeMode === "large"
                  ? "bg-[#1f293d] text-white font-bold shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Large
            </button>
            <button
              onClick={() => setSizeMode(sizeMode === "fullscreen" ? "medium" : "fullscreen")}
              title={sizeMode === "fullscreen" ? "Exit Fullscreen (ESC)" : "Maximize Map (Fullscreen)"}
              className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                sizeMode === "fullscreen"
                  ? "bg-[#ff4557] text-white font-bold shadow"
                  : "text-[#38bdf8] hover:bg-[#1f293d]"
              }`}
            >
              {sizeMode === "fullscreen" ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold pr-1">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold pr-1">Expand</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Compass Reset */}
          <button
            onClick={() => {
              setMapCenter(defaultCenter);
              setMapZoom(12);
              setActiveSidePanelAlert(null);
            }}
            title="Reset Map View to South Delhi / NCR"
            className="p-1.5 rounded-lg bg-[#131926] hover:bg-[#1b2436] text-[#94a3b8] hover:text-white border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP CANVAS WITH RESIZE CONTROLLER */}
      <div className={`relative w-full ${canvasHeight}`}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ background: "#07090e" }}
        >
          {/* Recenter controller */}
          <MapRecenterController center={mapCenter} zoom={mapZoom} />

          {/* Resize invalidation controller */}
          <MapResizeController sizeMode={sizeMode} />

          {/* Map click listener for Pinpoint Scout */}
          <MapPinpointController onPinpoint={handleMapPinpoint} />

          {/* OpenStreetMap tiles — free, no API key, no watermarks */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="osm-dark-tiles"
          />

          {/* Plotting Incident Alerts & Spatial Anchor Radii */}
          {filteredAlerts.map((alert) => {
            const { targetAtm, anchorLat, anchorLon } = alert.complaint;
            const score = alert.assessment.compositeScore;

            return (
              <React.Fragment key={alert.id}>
                {/* Visual heat dispersion circle around terminal anchor area */}
                <Circle
                  center={[anchorLat, anchorLon]}
                  radius={600}
                  pathOptions={{
                    color: score > 70 ? "#ff4557" : score >= 40 ? "#f59e0b" : "#00d26a",
                    fillColor: score > 70 ? "#ff4557" : score >= 40 ? "#f59e0b" : "#00d26a",
                    fillOpacity: score > 70 ? 0.15 : 0.08,
                    weight: 1,
                    dashArray: "4, 6"
                  }}
                />

                {/* ATM / Cash Withdrawal Point Marker */}
                <Marker
                  position={[targetAtm.latitude, targetAtm.longitude]}
                  icon={createAtmMarkerIcon(score, targetAtm.bankName)}
                  eventHandlers={{
                    click: () => handleMarkerClick(alert)
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Pinpoint Scout Overlays (Marker, Radar Buffer & Connecting Vector Polylines) */}
          {pinpoint && (
            <>
              {/* Outer Interdiction Perimeter Circle */}
              <Circle
                center={[pinpoint.lat, pinpoint.lng]}
                radius={1200}
                pathOptions={{
                  color: "#38bdf8",
                  fillColor: "#38bdf8",
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: "6, 6"
                }}
              />
              {/* Inner Immediate Intercept Buffer Circle */}
              <Circle
                center={[pinpoint.lat, pinpoint.lng]}
                radius={500}
                pathOptions={{
                  color: "#00d26a",
                  fillColor: "#00d26a",
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: "3, 4"
                }}
              />

              {/* Connecting Vector Lines to Top 3 Nearest ATMs */}
              {nearbyAtmsAnalysis.slice(0, 3).map((atm) => (
                <Polyline
                  key={`vector-${atm.atmId}`}
                  positions={[
                    [pinpoint.lat, pinpoint.lng],
                    [atm.latitude, atm.longitude]
                  ]}
                  pathOptions={{
                    color: atm.riskScore > 70 ? "#ff4557" : atm.riskScore >= 40 ? "#f59e0b" : "#00d26a",
                    weight: 2,
                    dashArray: "4, 6",
                    opacity: 0.85
                  }}
                />
              ))}

              {/* Pinpoint Crosshair Marker */}
              <Marker
                position={[pinpoint.lat, pinpoint.lng]}
                icon={createPinpointMarkerIcon()}
              />
            </>
          )}
        </MapContainer>

        {/* TACTICAL PINPOINT SCOUT & LIVE PREDICTION FLOATING CARD */}
        {pinpoint && pinpointPrediction && (
          <div className="absolute top-3 left-3 z-20 w-84 sm:w-96 max-w-[calc(100%-24px)] max-h-[calc(100%-48px)] bg-[#0d1424]/95 backdrop-blur-md border border-sky-500/40 rounded-xl shadow-2xl overflow-hidden font-sans text-white animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
            {/* Card Header */}
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-sky-950/80 to-[#0d1424] border-b border-sky-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                <span className="text-xs font-bold font-mono text-sky-300 tracking-wider">
                  PINPOINT SCOUT TELEMETRY
                </span>
              </div>
              <button
                onClick={() => {
                  setPinpoint(null);
                  setIsPinpointMode(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss Pinpoint Scout"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-3.5 overflow-y-auto space-y-3 text-xs">
              {/* Location & GPS Badge */}
              <div className="bg-[#080d1a] p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Target Locality</span>
                  <span className="text-[9.5px] font-mono text-sky-400">
                    {pinpoint.lat.toFixed(5)}°N, {pinpoint.lng.toFixed(5)}°E
                  </span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span className="truncate">{pinpoint.locality}</span>
                </div>
              </div>

              {/* Live Prediction Strip */}
              <div className="bg-[#0b1220] p-3 rounded-lg border border-sky-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10.5px] font-mono uppercase text-slate-300 font-bold">
                      Live Exit Prediction
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                      pinpointPrediction.exitProbability >= 75
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : pinpointPrediction.exitProbability >= 50
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {pinpointPrediction.threatLevel}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <div className="text-lg font-extrabold text-white">
                    {pinpointPrediction.exitProbability}%
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">Cash-Out Probability</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400">
                    ETA ~{pinpointPrediction.arrivalEtaMinutes}m
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pinpointPrediction.exitProbability >= 75
                        ? "bg-red-500"
                        : pinpointPrediction.exitProbability >= 50
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${pinpointPrediction.exitProbability}%` }}
                  />
                </div>

                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans mt-1">
                  {pinpointPrediction.recommendedAction}
                </p>
              </div>

              {/* Nearby ATMs Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <span>Nearby ATMs ({nearbyAtmsAnalysis.length})</span>
                  <span>Dist • Transit</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {nearbyAtmsAnalysis.map((atm, idx) => (
                    <div
                      key={atm.atmId}
                      onClick={() => {
                        const alert = alerts.find((a) => a.id === atm.alertId);
                        if (alert) handleMarkerClick(alert);
                      }}
                      className="p-2 rounded-lg bg-[#080d1a] hover:bg-[#111a2e] border border-slate-800 hover:border-sky-500/40 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-sky-400 font-bold">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white truncate max-w-[140px] group-hover:text-sky-300">
                            {atm.bankName}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-500 truncate">
                            {atm.atmId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {atm.address}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 font-mono">
                        <div className="text-[11px] font-bold text-emerald-400">
                          {atm.distanceMeters < 1000
                            ? `${atm.distanceMeters}m`
                            : `${atm.distanceKm.toFixed(1)}km`}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-end">
                          <span>{atm.walkMinutes}m walk</span>
                          <span>•</span>
                          <span className="text-amber-400">Risk {atm.riskScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Alert Notice */}
              {dispatchNotice && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-[10.5px] font-mono text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{dispatchNotice}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => {
                    const nearest = nearbyAtmsAnalysis[0];
                    setDispatchNotice(
                      `QRT Beat Patrol Alpha-3 dispatched to ${nearest?.bankName || "ATM"} (${nearest?.distanceMeters || 400}m buffer).`
                    );
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <Send className="w-3 h-3" />
                  <span>Dispatch Beat Patrol</span>
                </button>
                <button
                  onClick={() => {
                    setPinpoint(null);
                    setIsPinpointMode(false);
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Banner with Live Aggregates & Legal Disclaimer */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex items-end justify-between gap-4 z-10">
          <div className="pointer-events-auto bg-[#0d111a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5 flex items-center gap-4 text-xs font-mono shadow-xl">
            <div>
              <span className="text-[#94a3b8]">Active Nodes: </span>
              <span className="text-white font-bold">{filteredAlerts.length}</span>
            </div>
            <div className="w-px h-3 bg-[#1e2638]"></div>
            <div>
              <span className="text-[#94a3b8]">Capital at Risk: </span>
              <span className="text-[#38bdf8] font-bold font-mono">
                ₹{totalCapitalAtRisk.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto bg-[#0d111a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1 text-[10px] text-[#64748b] hidden sm:block">
            {BANK_NAME_DISCLAIMER}
          </div>
        </div>

        {/* 3. SLIDE-OUT DETAIL PANEL ON MARKER CLICK */}
        {activeSidePanelAlert && (
          <div className="absolute top-3 right-3 bottom-3 w-96 max-w-[calc(100%-24px)] bg-[#0d111a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Panel Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-start justify-between gap-2 bg-[#131926]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      activeSidePanelAlert.assessment.compositeScore > 70
                        ? "bg-[#ff4557]/20 text-[#ff4557] border border-[#ff4557]/40"
                        : activeSidePanelAlert.assessment.compositeScore >= 40
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-[#00d26a]/20 text-[#00d26a] border border-[#00d26a]/30"
                    }`}
                  >
                    Risk {activeSidePanelAlert.assessment.compositeScore}/100 • {activeSidePanelAlert.assessment.threatLevel}
                  </span>
                  <span className="text-[10px] font-mono text-[#94a3b8]">
                    {activeSidePanelAlert.complaint.targetAtm.atmId}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#38bdf8]" />
                  {activeSidePanelAlert.complaint.targetAtm.bankName}
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  {activeSidePanelAlert.complaint.targetAtm.address}
                </p>
              </div>

              <button
                onClick={() => setActiveSidePanelAlert(null)}
                className="p-1 rounded-lg bg-[#07090e] hover:bg-[#1b2436] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Primary Incident Telemetry */}
              <div className="grid grid-cols-2 gap-2 bg-[#07090e] p-3 rounded-lg border border-[rgba(255,255,255,0.06)] font-mono">
                <div>
                  <span className="text-[#64748b] text-[10px] uppercase">Incident ID:</span>
                  <p className="font-bold text-white">{activeSidePanelAlert.id}</p>
                </div>
                <div>
                  <span className="text-[#64748b] text-[10px] uppercase">Crime Category:</span>
                  <p className="font-bold text-[#ff4557]">{activeSidePanelAlert.complaint.crimeCategory}</p>
                </div>
                <div>
                  <span className="text-[#64748b] text-[10px] uppercase">Stolen Capital:</span>
                  <p className="font-bold text-[#00d26a]">
                    ₹{activeSidePanelAlert.complaint.stolenAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748b] text-[10px] uppercase">Est. Cashout ETA:</span>
                  <p className="font-bold text-amber-400">
                    {activeSidePanelAlert.assessment.urgencyWindowMinutes}m remaining
                  </p>
                </div>
              </div>

              {/* 4-Signal Scorer Breakdown */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono text-[#94a3b8] uppercase tracking-wider font-bold">
                  Signal Decomposition
                </h4>
                <div className="space-y-1.5">
                  {activeSidePanelAlert.assessment.breakdown.map((signal) => (
                    <div key={signal.signalName} className="p-2 rounded bg-[#131926] border border-[rgba(255,255,255,0.06)] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-white">{signal.signalName}</span>
                        <span className="font-mono text-[#00d26a] font-bold">{signal.normalizedScore}/100</span>
                      </div>
                      <div className="w-full bg-[#242f47] h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            signal.normalizedScore >= 75
                              ? "bg-[#ff4557]"
                              : signal.normalizedScore >= 45
                              ? "bg-amber-400"
                              : "bg-[#00d26a]"
                          }`}
                          style={{ width: `${signal.normalizedScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-Loop Advisory Formulation */}
              <div className="bg-[#ff4557]/10 border border-[#ff4557]/30 p-3 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#ff4557] font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Recommendation for Officer Sign-off</span>
                </div>
                <p className="text-[11px] text-[#f1f5f9] leading-relaxed">
                  {activeSidePanelAlert.assessment.advisoryRecommendation}
                </p>
                <div className="text-[9px] text-[#64748b] font-mono uppercase tracking-wider">
                  Advisory Only • Section 102 BNSS Provisional Formulation
                </div>
              </div>
            </div>

            {/* Panel Footer CTA */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[#131926]">
              <button
                onClick={() => {
                  if (onRecommendAction) {
                    onRecommendAction(activeSidePanelAlert);
                  }
                }}
                className="w-full py-2.5 px-3 kalshi-btn-yes text-black rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Review & Recommend Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
