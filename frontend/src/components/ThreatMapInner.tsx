"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { ATMNode } from "@/lib/api";
import { Shield, Navigation, AlertTriangle, Building, Radio, Video, Layers, Eye, Compass, Car } from "lucide-react";

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

// Custom HTML Icons for Leaflet to support pulsing animations & technical Eraser aesthetic
const createKycBranchIcon = () => {
  return L.divIcon({
    className: "kyc-marker-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(0, 169, 229, 0.25); border: 2px solid #00a9e5;"></div>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; background: #00a9e5; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 0 10px #00a9e5;">
          🏛️
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createAtmIcon = (isHighRisk: boolean, prob: number) => {
  const color = isHighRisk ? "#ec2c40" : "#10b981";
  const pulseClass = isHighRisk ? "pulse-target-red" : "";
  const bgClass = isHighRisk ? "rgba(236, 44, 64, 0.3)" : "rgba(16, 185, 129, 0.2)";

  return L.divIcon({
    className: `atm-marker-${isHighRisk ? "high" : "normal"}`,
    html: `
      <div class="${pulseClass}" style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${bgClass}; border: 2px solid ${color};"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; box-shadow: 0 0 12px ${color};">
          ${(prob * 100).toFixed(0)}%
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

const createCctvIcon = () => {
  return L.divIcon({
    className: "cctv-marker-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(139, 92, 246, 0.3); border: 1.5px solid #8b5cf6;"></div>
        <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 0 8px #8b5cf6;">
          📹
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const createPatrolIconWithEta = (etaStr: string) => {
  return L.divIcon({
    className: "patrol-marker-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.3); border: 2px dashed #38bdf8;"></div>
          <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: #2866df; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 12px #38bdf8;">
            🚓
          </div>
        </div>
        <div style="background: rgba(15, 17, 24, 0.95); border: 1px solid #38bdf8; border-radius: 4px; padding: 1px 6px; color: #38bdf8; font-family: ui-monospace, Menlo, monospace; font-size: 9px; font-weight: bold; margin-top: 1px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
          ${etaStr}
        </div>
      </div>
    `,
    iconSize: [46, 52],
    iconAnchor: [23, 19],
    popupAnchor: [0, -19]
  });
};

function ChangeMapView({ centerLat, centerLon }: { centerLat: number; centerLon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([centerLat, centerLon], 14, { animate: true });
  }, [centerLat, centerLon, map]);
  return null;
}

export default function ThreatMapInner({
  centerLat,
  centerLon,
  radiusKm,
  candidateAtms,
  threshold,
  selectedAtm,
  onSelectAtm,
  onOpenDispatch
}: Props) {
  // Layer controls state
  const [showRiskBuffer, setShowRiskBuffer] = useState<boolean>(true);
  const [showCctvCoverage, setShowCctvCoverage] = useState<boolean>(true);
  const [showPatrolTelemetry, setShowPatrolTelemetry] = useState<boolean>(true);

  // Patrol unit location (offset near South Delhi node)
  const patrolLat = centerLat + 0.0075;
  const patrolLon = centerLon - 0.0085;

  const topTarget = candidateAtms.find((a) => a.cash_out_probability >= threshold) || candidateAtms[0];

  // Static CCTV camera sightlines
  const cctvCameras = [
    {
      id: "DL-SOUTH-CAM-1049",
      lat: centerLat + 0.0018,
      lon: centerLon + 0.0012,
      facing: "Outer Ring Rd ATM Cluster",
      coverageRadiusMeters: 500,
      status: "Live / Active",
      fps: "30 FPS (H.265)"
    },
    {
      id: "DL-SOUTH-CAM-1052",
      lat: centerLat - 0.0022,
      lon: centerLon + 0.0015,
      facing: "Main Market SBI ATM Intersection",
      coverageRadiusMeters: 500,
      status: "Live / Active",
      fps: "30 FPS (H.265)"
    },
    {
      id: "DL-SOUTH-CAM-1088",
      lat: centerLat + 0.0031,
      lon: centerLon - 0.0025,
      facing: "Canara Bank Node Sightline",
      coverageRadiusMeters: 500,
      status: "Live / Active",
      fps: "25 FPS (H.264)"
    },
    {
      id: "DL-SOUTH-CAM-1104",
      lat: centerLat - 0.0015,
      lon: centerLon - 0.0035,
      facing: "Saket Metro Feeder Lane",
      coverageRadiusMeters: 500,
      status: "Live / Active",
      fps: "30 FPS (H.265)"
    }
  ];

  // OpenStreetMap-based dark tile — free, no API key required
  const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-[var(--grey-700)] bg-[var(--grey-100)] z-0 isolate flex flex-col shadow-[var(--small-shadow)]">
      {/* Eraser Window Chrome Top Header */}
      <div className="bg-[var(--grey-200)] border-b border-[var(--grey-700)] px-3 py-2 flex items-center justify-between z-20 select-none">
        <div className="flex items-center gap-2">
          {/* Chrome dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--grey-500)] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--grey-500)] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--grey-500)] inline-block"></span>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--grey-1300)] uppercase tracking-wider flex items-center gap-2">
            <span>CANVAS: SPATIAL THREAT MAP</span>
            <span className="pill brand text-[9px] py-0 px-1.5">LIVE OSM & POSTGIS</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--grey-1000)]">
          <span className="hidden sm:inline">RADIUS: {radiusKm} KM BUFFER</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald-primary)] animate-pulse"></span>
        </div>
      </div>

      {/* Interactive Layer Controls Floating Panel */}
      <div className="absolute top-11 right-3 z-30 bg-[var(--grey-0)]/95 border border-[var(--grey-700)] rounded-lg p-2.5 backdrop-blur-md shadow-[var(--small-shadow)] font-mono text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center gap-1.5 text-[var(--grey-1400)] font-bold border-b border-[var(--grey-700)] pb-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--blue-primary)]" />
          <span className="uppercase tracking-wider text-[10px]">TACTICAL GIS OVERLAYS</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {/* Toggle 1: ATM Risk Buffer */}
          <label className="flex items-center gap-2 text-[var(--grey-1100)] hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRiskBuffer}
              onChange={(e) => setShowRiskBuffer(e.target.checked)}
              className="rounded bg-[var(--grey-200)] border-[var(--grey-500)] text-[var(--red-primary)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--red-primary)]"></span>
              <span>ATM Buffer ({radiusKm} km)</span>
            </span>
          </label>

          {/* Toggle 2: CCTV Coverage */}
          <label className="flex items-center gap-2 text-[var(--grey-1100)] hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCctvCoverage}
              onChange={(e) => setShowCctvCoverage(e.target.checked)}
              className="rounded bg-[var(--grey-200)] border-[var(--grey-500)] text-[var(--purple-primary)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--purple-primary)]"></span>
              <span>CCTV Sightlines (500m)</span>
            </span>
          </label>

          {/* Toggle 3: PCR Van Telemetry */}
          <label className="flex items-center gap-2 text-[var(--grey-1100)] hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPatrolTelemetry}
              onChange={(e) => setShowPatrolTelemetry(e.target.checked)}
              className="rounded bg-[var(--grey-200)] border-[var(--grey-500)] text-[var(--blue-link)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--blue-link)]"></span>
              <span>PCR Alpha-4 Telemetry</span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <ChangeMapView centerLat={centerLat} centerLon={centerLon} />

          {/* OpenStreetMap tiles — free, no API key, no watermarks */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="osm-dark-tiles"
          />

          {/* 1. Spatial Perimeter Buffer */}
          {showRiskBuffer && (
            <Circle
              center={[centerLat, centerLon]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#ec2c40",
                fillColor: "#ec2c40",
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: "6, 8"
              }}
            />
          )}

          {/* 2. CCTV Surveillance Sightline Circles */}
          {showCctvCoverage &&
            cctvCameras.map((cam) => (
              <React.Fragment key={cam.id}>
                <Circle
                  center={[cam.lat, cam.lon]}
                  radius={cam.coverageRadiusMeters}
                  pathOptions={{
                    color: "#8b5cf6",
                    fillColor: "#8b5cf6",
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: "3, 5"
                  }}
                />
                <Marker position={[cam.lat, cam.lon]} icon={createCctvIcon()}>
                  <Popup>
                    <div className="p-1 min-w-[220px] text-[var(--grey-1300)] font-sans text-xs">
                      <div className="flex items-center justify-between border-b border-[var(--grey-500)] pb-1 mb-1 font-mono">
                        <span className="font-bold text-[var(--purple-primary)]">{cam.id}</span>
                        <span className="pill templates text-[9px] py-0 px-1.5">
                          {cam.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono text-[var(--grey-1100)]">
                        <div>Facing: {cam.facing}</div>
                        <div>Stream: {cam.fps}</div>
                        <div className="text-[var(--emerald-primary)]">Night Vision: IR ACTIVE</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

          {/* 3. KYC Registered Home Branch Anchor */}
          <Marker position={[centerLat, centerLon]} icon={createKycBranchIcon()}>
            <Popup>
              <div className="p-1 min-w-[210px] text-[var(--grey-1300)] font-sans">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--blue-link)] border-b border-[var(--grey-500)] pb-1 mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>TERMINAL MULE KYC ANCHOR</span>
                </div>
                <div className="text-xs text-[var(--grey-1100)]">
                  Coordinates: {centerLat.toFixed(4)}° N, {centerLon.toFixed(4)}° E
                </div>
                <div className="mt-1 text-[11px] font-mono text-[var(--blue-link)]">
                  Interdiction Buffer: {radiusKm} km
                </div>
              </div>
            </Popup>
          </Marker>

          {/* 4. Active PCR Van Telemetry */}
          {showPatrolTelemetry && (
            <Marker position={[patrolLat, patrolLon]} icon={createPatrolIconWithEta("ETA: 4 mins")}>
              <Popup>
                <div className="p-1 min-w-[220px] text-[var(--grey-1300)] font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--grey-500)] pb-1 mb-1 font-mono">
                    <span className="font-bold text-[var(--blue-link)]">PCR VAN UNIT ALPHA-4</span>
                    <span className="pill brand text-[9px] py-0 px-1.5">
                      INTERCEPT MOBILIZED
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono text-[var(--grey-1100)]">
                    <div>Officer in Charge: SI A. Negi</div>
                    <div>Vehicle GPS: 28.5443° N, 77.2017° E</div>
                    <div className="text-[var(--blue-link)] font-bold">Speed: 42 km/h | ETA: 4 mins</div>
                    <div className="text-[var(--amber-primary)]">Assigned Target: {topTarget?.bank_name} ATM</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vector Line Connecting KYC Anchor to Top Interdiction Target */}
          {topTarget && (
            <Polyline
              positions={[
                [centerLat, centerLon],
                [topTarget.latitude, topTarget.longitude]
              ]}
              pathOptions={{
                color: "#ec2c40",
                weight: 2,
                dashArray: "4, 6",
                opacity: 0.85
              }}
            />
          )}

          {/* Vector Line Connecting Patrol Unit to Target Node */}
          {showPatrolTelemetry && topTarget && (
            <Polyline
              positions={[
                [patrolLat, patrolLon],
                [topTarget.latitude, topTarget.longitude]
              ]}
              pathOptions={{
                color: "#00a9e5",
                weight: 1.5,
                dashArray: "3, 6",
                opacity: 0.75
              }}
            />
          )}

          {/* Candidate ATM Markers */}
          {candidateAtms.map((atm) => {
            const isHighRisk = atm.cash_out_probability >= threshold;
            return (
              <Marker
                key={atm.atm_id}
                position={[atm.latitude, atm.longitude]}
                icon={createAtmIcon(isHighRisk, atm.cash_out_probability)}
                eventHandlers={{
                  click: () => {
                    onSelectAtm(atm);
                    onOpenDispatch(atm);
                  }
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[240px] text-[var(--grey-1300)] font-sans">
                    <div className="flex items-center justify-between border-b border-[var(--grey-500)] pb-1 mb-1.5">
                      <span className="text-xs font-bold text-white uppercase">{atm.bank_name}</span>
                      <span
                        className={`pill text-[9px] py-0 px-1.5 ${
                          isHighRisk ? "danger" : "agents"
                        }`}
                      >
                        {isHighRisk ? "CRITICAL HOTSPOT" : "MONITORED"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-[var(--grey-1000)] text-[11px] leading-snug">{atm.address}</div>
                      <div className="flex justify-between font-mono text-[11px] text-[var(--grey-900)] pt-1">
                        <span>Operator:</span>
                        <span className="text-[var(--grey-1300)]">{atm.operator}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px] text-[var(--grey-900)]">
                        <span>Distance to Anchor:</span>
                        <span className="text-[var(--blue-link)] font-bold">{atm.distance_km} km</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px] text-[var(--grey-900)]">
                        <span>Crime Density Score:</span>
                        <span className="text-[var(--amber-primary)] font-bold">{(atm.crime_density_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px] text-[var(--grey-900)] border-t border-[var(--grey-700)] pt-1">
                        <span>Cash-Out Probability:</span>
                        <span className="text-[var(--red-primary)] font-bold font-mono text-sm">
                          {(atm.cash_out_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[var(--grey-500)] flex items-center gap-2">
                      <button
                        onClick={() => onOpenDispatch(atm)}
                        className="btn danger default w-full font-mono text-xs font-bold"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Open Spatial Interdiction Briefing</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Tactical Legend Bar (Eraser Monospace Status Strip) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[var(--grey-0)]/90 border border-[var(--grey-700)] rounded-lg px-3 py-1.5 backdrop-blur-md shadow-[var(--small-shadow)] flex flex-wrap items-center gap-3 text-[10.5px] font-mono text-[var(--grey-1100)] select-none">
        <span className="text-[var(--grey-900)] font-bold uppercase tracking-wider">LEGEND:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--red-primary)] animate-pulse"></span>
          <span>High-Risk (&gt;= {threshold.toFixed(2)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--emerald-primary)]"></span>
          <span>Candidate ATM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--blue-primary)]"></span>
          <span>KYC Anchor ({radiusKm}km)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--purple-primary)]"></span>
          <span>CCTV (500m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--blue-link)]"></span>
          <span>PCR Alpha-4</span>
        </div>
      </div>
    </div>
  );
}
