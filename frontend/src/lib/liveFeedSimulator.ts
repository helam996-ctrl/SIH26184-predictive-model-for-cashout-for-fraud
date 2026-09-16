/**
 * CyberSuraksha - Live Feed Simulator
 * 
 * Ingests simulated cybercrime complaints derived from PaySim mobile money transaction
 * distributions at continuous 6-10 second intervals.
 * 
 * Pipeline:
 * 1. Sequential ingestion of PaySim complaint patterns
 * 2. Automatic evaluation via pure risk scoring engine (lib/riskEngine.ts)
 * 3. Priority queue maintaining alerts sorted by composite risk score descending
 * 4. Human-in-the-loop state tracking (PENDING_REVIEW -> REVIEWED -> RECOMMENDED)
 * 5. Telemetry indicators: Pulsing LIVE status & elapsed seconds since last update
 */

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  ReactNode
} from "react";
import { MockComplaintRecord, MOCK_COMPLAINTS } from "./mockDataset";
import { evaluateRiskScore, RiskAssessment } from "./riskEngine";

export type AlertStatus = "PENDING_REVIEW" | "REVIEWED" | "RECOMMENDED" | "DISMISSED";

export interface EnrichedAlert {
  id: string;
  complaint: MockComplaintRecord;
  assessment: RiskAssessment;
  ingestedAt: string;
  status: AlertStatus;
  officerNotes?: string;
  reviewedAt?: string;
  actionRecommendedAt?: string;
  actionNoticeRef?: string;
}

export interface LiveFeedOptions {
  intervalMs?: number;       // Ingestion cadence (default 8000ms / 8s)
  initialBatchCount?: number; // Pre-seeded alerts on mount (default 5)
  autoStart?: boolean;        // Start automatically on mount (default true)
  defaultThreshold?: number;  // Default minimum risk score filter (default 0)
}

export interface LiveFeedState {
  alerts: EnrichedAlert[];
  latestAlert: EnrichedAlert | null;
  isLive: boolean;
  secondsSinceLastUpdate: number;
  lastUpdatedAt: Date | null;
  totalProcessedCount: number;
  currentIndex: number;
  minRiskThreshold: number;
  selectedAlertId: string | null;
  selectedAlert: EnrichedAlert | null;
}

export interface LiveFeedActions {
  toggleLive: () => void;
  startLive: () => void;
  pauseLive: () => void;
  triggerNext: () => EnrichedAlert | null;
  resetFeed: () => void;
  selectAlert: (id: string | null) => void;
  updateAlertStatus: (id: string, status: AlertStatus, notes?: string, noticeRef?: string) => void;
  setMinRiskThreshold: (threshold: number) => void;
}

export type LiveFeedContextValue = LiveFeedState & LiveFeedActions;

/**
 * Pure factory: Evaluates incoming complaint telemetry through the pure risk engine
 * and constructs an EnrichedAlert record with human-in-the-loop lifecycle state.
 */
export function createEnrichedAlert(
  record: MockComplaintRecord,
  instanceSuffix?: string
): EnrichedAlert {
  const assessment = evaluateRiskScore(record);
  return {
    id: instanceSuffix ? `${record.id}-${instanceSuffix}` : record.id,
    complaint: record,
    assessment,
    ingestedAt: new Date().toISOString(),
    status: "PENDING_REVIEW"
  };
}

/**
 * Pure comparator: Sorts alerts primarily by composite risk score descending,
 * secondarily by tactical urgency window (shortest response window first).
 */
export function sortAlertsByPriority(alerts: EnrichedAlert[]): EnrichedAlert[] {
  return [...alerts].sort((a, b) => {
    // Primary: Higher composite risk score first
    if (b.assessment.compositeScore !== a.assessment.compositeScore) {
      return b.assessment.compositeScore - a.assessment.compositeScore;
    }
    // Secondary: Shorter urgency window first
    if (a.assessment.urgencyWindowMinutes !== b.assessment.urgencyWindowMinutes) {
      return a.assessment.urgencyWindowMinutes - b.assessment.urgencyWindowMinutes;
    }
    // Tertiary: Newest ingestion first
    return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime();
  });
}

/**
 * Generates the initial seed batch of enriched alerts from the mock dataset
 */
export function generateInitialAlerts(count: number = 5): EnrichedAlert[] {
  const seedCount = Math.min(count, MOCK_COMPLAINTS.length);
  const initial: EnrichedAlert[] = [];
  
  for (let i = 0; i < seedCount; i++) {
    initial.push(createEnrichedAlert(MOCK_COMPLAINTS[i]));
  }

  return sortAlertsByPriority(initial);
}

/**
 * Primary React Hook: Manages live continuous feed simulation
 */
export function useLiveFeed(options: LiveFeedOptions = {}): LiveFeedContextValue {
  const {
    intervalMs = 8000,
    initialBatchCount = 5,
    autoStart = true,
    defaultThreshold = 0
  } = options;

  // Alerts array sorted descending by risk score
  const [alerts, setAlerts] = useState<EnrichedAlert[]>(() => 
    generateInitialAlerts(initialBatchCount)
  );
  
  const [latestAlert, setLatestAlert] = useState<EnrichedAlert | null>(() => {
    const initial = generateInitialAlerts(initialBatchCount);
    return initial.length > 0 ? initial[0] : null;
  });

  const [isLive, setIsLive] = useState<boolean>(autoStart);
  const [secondsSinceLastUpdate, setSecondsSinceLastUpdate] = useState<number>(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(() => new Date());
  const [currentIndex, setCurrentIndex] = useState<number>(initialBatchCount % MOCK_COMPLAINTS.length);
  const [totalProcessedCount, setTotalProcessedCount] = useState<number>(initialBatchCount);
  const [minRiskThreshold, setMinRiskThreshold] = useState<number>(defaultThreshold);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // References to prevent stale closures in setInterval
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const totalProcessedRef = useRef(totalProcessedCount);
  totalProcessedRef.current = totalProcessedCount;

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  /**
   * Pushes the next sequential complaint record into the active alert queue
   */
  const triggerNext = useCallback((): EnrichedAlert | null => {
    if (MOCK_COMPLAINTS.length === 0) return null;

    const idx = currentIndexRef.current;
    const rawRecord = MOCK_COMPLAINTS[idx];
    const loopCycle = Math.floor(totalProcessedRef.current / MOCK_COMPLAINTS.length);
    const suffix = loopCycle > 0 ? `CYC${loopCycle}` : undefined;
    
    const newAlert = createEnrichedAlert(rawRecord, suffix);

    setAlerts((prevAlerts) => {
      // Remove any existing copy with identical ID if present, then add new
      const filtered = prevAlerts.filter((a) => a.id !== newAlert.id);
      const updated = [newAlert, ...filtered];
      return sortAlertsByPriority(updated);
    });

    setLatestAlert(newAlert);
    setLastUpdatedAt(new Date());
    setSecondsSinceLastUpdate(0);

    const nextIndex = (idx + 1) % MOCK_COMPLAINTS.length;
    setCurrentIndex(nextIndex);
    setTotalProcessedCount((prev) => prev + 1);

    return newAlert;
  }, []);

  /**
   * Toggles live streaming simulation on/off
   */
  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  const startLive = useCallback(() => {
    setIsLive(true);
  }, []);

  const pauseLive = useCallback(() => {
    setIsLive(false);
  }, []);

  /**
   * Resets feed back to initial seed batch
   */
  const resetFeed = useCallback(() => {
    const initial = generateInitialAlerts(initialBatchCount);
    setAlerts(initial);
    setLatestAlert(initial.length > 0 ? initial[0] : null);
    setLastUpdatedAt(new Date());
    setSecondsSinceLastUpdate(0);
    setCurrentIndex(initialBatchCount % MOCK_COMPLAINTS.length);
    setTotalProcessedCount(initialBatchCount);
    setSelectedAlertId(null);
  }, [initialBatchCount]);

  /**
   * Selects an alert for detailed review modal / dossier
   */
  const selectAlert = useCallback((id: string | null) => {
    setSelectedAlertId(id);
  }, []);

  /**
   * Human-in-the-loop state mutation
   * Updates recommendation / review status for an alert
   */
  const updateAlertStatus = useCallback((
    id: string,
    status: AlertStatus,
    notes?: string,
    noticeRef?: string
  ) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          officerNotes: notes ?? item.officerNotes,
          reviewedAt: status !== "PENDING_REVIEW" ? (item.reviewedAt || new Date().toISOString()) : undefined,
          actionRecommendedAt: status === "RECOMMENDED" ? new Date().toISOString() : item.actionRecommendedAt,
          actionNoticeRef: noticeRef ?? item.actionNoticeRef
        };
      })
    );
  }, []);

  // Timer 1: Ingestion loop every intervalMs (e.g. 8s) when isLive is true
  useEffect(() => {
    if (!isLive) return;

    const streamTimer = setInterval(() => {
      triggerNext();
    }, intervalMs);

    return () => clearInterval(streamTimer);
  }, [isLive, intervalMs, triggerNext]);

  // Timer 2: Elapsed seconds counter since last update (ticks every 1s)
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsSinceLastUpdate((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Resolved selected alert entity
  const selectedAlert = selectedAlertId
    ? alerts.find((a) => a.id === selectedAlertId) || null
    : null;

  return {
    alerts,
    latestAlert,
    isLive,
    secondsSinceLastUpdate,
    lastUpdatedAt,
    totalProcessedCount,
    currentIndex,
    minRiskThreshold,
    selectedAlertId,
    selectedAlert,
    toggleLive,
    startLive,
    pauseLive,
    triggerNext,
    resetFeed,
    selectAlert,
    updateAlertStatus,
    setMinRiskThreshold
  };
}

/**
 * Shared Context for universal access across components
 */
const LiveFeedContext = createContext<LiveFeedContextValue | undefined>(undefined);

export interface LiveFeedProviderProps {
  children: ReactNode;
  options?: LiveFeedOptions;
}

export function LiveFeedProvider({ children, options }: LiveFeedProviderProps) {
  const feed = useLiveFeed(options);
  return React.createElement(LiveFeedContext.Provider, { value: feed }, children);
}

/**
 * Hook to consume live feed context in child components
 */
export function useLiveFeedContext(): LiveFeedContextValue {
  const context = useContext(LiveFeedContext);
  if (!context) {
    throw new Error("useLiveFeedContext must be used within a LiveFeedProvider");
  }
  return context;
}
