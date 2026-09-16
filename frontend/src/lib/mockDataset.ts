/**
 * CyberSuraksha - Synthetic Mock Dataset
 * Derived from PaySim (Kaggle) mobile money transaction simulation distributions.
 * 
 * Demonstrates TRANSFER -> CASH_OUT layering velocity, dormancy reactivation,
 * and rapid multi-hop displacement patterns for law enforcement decision support.
 */

export const BANK_NAME_DISCLAIMER = "Bank names used for illustrative purposes only.";
export const SYNTHETIC_DATA_BADGE = "SYNTHETIC DEMO DATA — DERIVED FROM PAYSIM (KAGGLE), FOR ILLUSTRATIVE/HACKATHON DEMO PURPOSES ONLY";

export type CrimeCategory = 
  | "Investment Scam" 
  | "Digital Arrest" 
  | "Job Task Fraud" 
  | "SIM Swap" 
  | "Loan App Extortion";

export interface MockTransactionHop {
  hopLevel: number;
  fromAccount: string;
  toAccount: string;
  fromBank: string;
  toBank: string;
  amount: number;
  channel: "IMPS" | "UPI" | "NEFT" | "RTGS";
  utr: string;
  timeDeltaMinutes: number;
}

export interface MockAtmLocation {
  atmId: string;
  bankName: string;
  operator: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  vaultCashInr: number;
  singleWithdrawalLimitInr: number;
  historicalIncidentCount: number;
}

export interface MockComplaintRecord {
  id: string;
  timestamp: string;
  victimName: string;
  victimAccount: string;
  victimBank: string;
  stolenAmount: number;
  crimeCategory: CrimeCategory;
  transferVelocityInrPerMin: number;
  hopsCount: number;
  chain: MockTransactionHop[];
  originatingAccountAgeDays: number;
  terminalAccount: string;
  terminalHolderName: string;
  terminalBank: string;
  terminalAccountAgeDays: number;
  isDormantReactivated: boolean;
  dormancyDays: number;
  anchorArea: string;
  anchorLat: number;
  anchorLon: number;
  proximityToHistoricalHotspotKm: number;
  reportedMinutesAgo: number;
  targetAtm: MockAtmLocation;
}

// 20 High-fidelity PaySim-derived mock complaint scenarios across South Delhi/NCR
export const MOCK_COMPLAINTS: MockComplaintRecord[] = [
  {
    id: "NCRP-2026-88101",
    timestamp: "2026-09-15T16:42:10Z",
    victimName: "Sunita Deshmukh",
    victimAccount: "XX91023841",
    victimBank: "State Bank of India",
    stolenAmount: 385000,
    crimeCategory: "Digital Arrest",
    transferVelocityInrPerMin: 48125,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX91023841",
        toAccount: "XX18204918",
        fromBank: "State Bank of India",
        toBank: "Canara Bank",
        amount: 385000,
        channel: "RTGS",
        utr: "SBIN261890124",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 2,
        fromAccount: "XX18204918",
        toAccount: "XX55928172",
        fromBank: "Canara Bank",
        toBank: "Punjab National Bank",
        amount: 385000,
        channel: "IMPS",
        utr: "CNRB882910482",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 3,
        fromAccount: "XX55928172",
        toAccount: "XX77109283",
        fromBank: "Punjab National Bank",
        toBank: "HDFC Bank",
        amount: 385000,
        channel: "IMPS",
        utr: "PUNB991029481",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1420,
    terminalAccount: "XX77109283",
    terminalHolderName: "M/s Aryan Logistics (Sole Prop)",
    terminalBank: "HDFC Bank",
    terminalAccountAgeDays: 45,
    isDormantReactivated: true,
    dormancyDays: 240,
    anchorArea: "Malviya Nagar / Saket",
    anchorLat: 28.5284,
    anchorLon: 77.2185,
    proximityToHistoricalHotspotKm: 0.28,
    reportedMinutesAgo: 14,
    targetAtm: {
      atmId: "ATM-DL-SAK-01",
      bankName: "HDFC Bank",
      operator: "HDFC ATM Ops",
      address: "Ground Floor, Community Centre, Saket, New Delhi",
      latitude: 28.5276,
      longitude: 77.2198,
      distanceKm: 0.32,
      vaultCashInr: 1250000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 14
    }
  },
  {
    id: "NCRP-2026-88102",
    timestamp: "2026-09-15T16:48:30Z",
    victimName: "Rakesh Verma",
    victimAccount: "XX44810293",
    victimBank: "ICICI Bank",
    stolenAmount: 520000,
    crimeCategory: "Investment Scam",
    transferVelocityInrPerMin: 65000,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX44810293",
        toAccount: "XX88192031",
        fromBank: "ICICI Bank",
        toBank: "Axis Bank",
        amount: 520000,
        channel: "NEFT",
        utr: "ICIC992019482",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX88192031",
        toAccount: "XX33819204",
        fromBank: "Axis Bank",
        toBank: "State Bank of India",
        amount: 520000,
        channel: "IMPS",
        utr: "UTIB771029481",
        timeDeltaMinutes: 4
      },
      {
        hopLevel: 3,
        fromAccount: "XX33819204",
        toAccount: "XX99201948",
        fromBank: "State Bank of India",
        toBank: "Bank of Baroda",
        amount: 520000,
        channel: "UPI",
        utr: "SBIN881920391",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 980,
    terminalAccount: "XX99201948",
    terminalHolderName: "Karan Enterprises",
    terminalBank: "Bank of Baroda",
    terminalAccountAgeDays: 32,
    isDormantReactivated: true,
    dormancyDays: 310,
    anchorArea: "Nehru Place",
    anchorLat: 28.5492,
    anchorLon: 77.2526,
    proximityToHistoricalHotspotKm: 0.18,
    reportedMinutesAgo: 10,
    targetAtm: {
      atmId: "ATM-DL-NP-02",
      bankName: "Bank of Baroda",
      operator: "EPS Network",
      address: "Eros Corporate Tower, Nehru Place, New Delhi",
      latitude: 28.5485,
      longitude: 77.2539,
      distanceKm: 0.22,
      vaultCashInr: 980000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 19
    }
  },
  {
    id: "NCRP-2026-88103",
    timestamp: "2026-09-15T16:51:00Z",
    victimName: "Pooja Hegde",
    victimAccount: "XX11928374",
    victimBank: "Axis Bank",
    stolenAmount: 75000,
    crimeCategory: "Job Task Fraud",
    transferVelocityInrPerMin: 12500,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX11928374",
        toAccount: "XX77291048",
        fromBank: "Axis Bank",
        toBank: "Canara Bank",
        amount: 75000,
        channel: "UPI",
        utr: "UTIB661928301",
        timeDeltaMinutes: 4
      },
      {
        hopLevel: 2,
        fromAccount: "XX77291048",
        toAccount: "XX44019283",
        fromBank: "Canara Bank",
        toBank: "Union Bank of India",
        amount: 75000,
        channel: "IMPS",
        utr: "CNRB771029481",
        timeDeltaMinutes: 7
      }
    ],
    originatingAccountAgeDays: 450,
    terminalAccount: "XX44019283",
    terminalHolderName: "Rahul Sharma",
    terminalBank: "Union Bank of India",
    terminalAccountAgeDays: 190,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Lajpat Nagar",
    anchorLat: 28.5678,
    anchorLon: 77.2433,
    proximityToHistoricalHotspotKm: 1.15,
    reportedMinutesAgo: 22,
    targetAtm: {
      atmId: "ATM-DL-LJP-01",
      bankName: "Union Bank of India",
      operator: "Diebold Nixdorf",
      address: "Central Market, Lajpat Nagar II, New Delhi",
      latitude: 28.5691,
      longitude: 77.2415,
      distanceKm: 0.85,
      vaultCashInr: 650000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 4
    }
  },
  {
    id: "NCRP-2026-88104",
    timestamp: "2026-09-15T16:55:12Z",
    victimName: "Lt. Col. R. K. Nair (Retd)",
    victimAccount: "XX66192038",
    victimBank: "Punjab National Bank",
    stolenAmount: 720000,
    crimeCategory: "Digital Arrest",
    transferVelocityInrPerMin: 90000,
    hopsCount: 4,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX66192038",
        toAccount: "XX22910293",
        fromBank: "Punjab National Bank",
        toBank: "State Bank of India",
        amount: 720000,
        channel: "RTGS",
        utr: "PUNB339102948",
        timeDeltaMinutes: 1
      },
      {
        hopLevel: 2,
        fromAccount: "XX22910293",
        toAccount: "XX88192049",
        fromBank: "State Bank of India",
        toBank: "ICICI Bank",
        amount: 720000,
        channel: "IMPS",
        utr: "SBIN449102938",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 3,
        fromAccount: "XX88192049",
        toAccount: "XX55192038",
        fromBank: "ICICI Bank",
        toBank: "Axis Bank",
        amount: 720000,
        channel: "IMPS",
        utr: "ICIC559102938",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 4,
        fromAccount: "XX55192038",
        toAccount: "XX11928301",
        fromBank: "Axis Bank",
        toBank: "Canara Bank",
        amount: 720000,
        channel: "IMPS",
        utr: "UTIB881920391",
        timeDeltaMinutes: 7
      }
    ],
    originatingAccountAgeDays: 2400,
    terminalAccount: "XX11928301",
    terminalHolderName: "Apex Retail Solutions",
    terminalBank: "Canara Bank",
    terminalAccountAgeDays: 21,
    isDormantReactivated: true,
    dormancyDays: 195,
    anchorArea: "Badarpur / Okhla Border",
    anchorLat: 28.5034,
    anchorLon: 77.3018,
    proximityToHistoricalHotspotKm: 0.15,
    reportedMinutesAgo: 6,
    targetAtm: {
      atmId: "ATM-DL-BDP-03",
      bankName: "Canara Bank",
      operator: "Canara Express ATM",
      address: "Near Metro Pillar 128, Badarpur Border, New Delhi",
      latitude: 28.5041,
      longitude: 77.3025,
      distanceKm: 0.18,
      vaultCashInr: 1800000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 26
    }
  },
  {
    id: "NCRP-2026-88105",
    timestamp: "2026-09-15T16:59:40Z",
    victimName: "Amitabh Sen",
    victimAccount: "XX88291048",
    victimBank: "HDFC Bank",
    stolenAmount: 185000,
    crimeCategory: "SIM Swap",
    transferVelocityInrPerMin: 37000,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX88291048",
        toAccount: "XX33102948",
        fromBank: "HDFC Bank",
        toBank: "Kotak Mahindra Bank",
        amount: 185000,
        channel: "IMPS",
        utr: "HDFC991029381",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX33102948",
        toAccount: "XX77491029",
        fromBank: "Kotak Mahindra Bank",
        toBank: "State Bank of India",
        amount: 185000,
        channel: "UPI",
        utr: "KKBK449102938",
        timeDeltaMinutes: 4
      }
    ],
    originatingAccountAgeDays: 820,
    terminalAccount: "XX77491029",
    terminalHolderName: "Vipin Kumar",
    terminalBank: "State Bank of India",
    terminalAccountAgeDays: 310,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Hauz Khas",
    anchorLat: 28.5494,
    anchorLon: 77.2001,
    proximityToHistoricalHotspotKm: 0.65,
    reportedMinutesAgo: 16,
    targetAtm: {
      atmId: "ATM-DL-HK-01",
      bankName: "State Bank of India",
      operator: "SBI InTouch",
      address: "Aurobindo Marg, Hauz Khas Village Gate, New Delhi",
      latitude: 28.5488,
      longitude: 77.2014,
      distanceKm: 0.45,
      vaultCashInr: 1450000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 8
    }
  },
  {
    id: "NCRP-2026-88106",
    timestamp: "2026-09-15T17:02:18Z",
    victimName: "Meenakshi Sundaram",
    victimAccount: "XX99201948",
    victimBank: "Canara Bank",
    stolenAmount: 45000,
    crimeCategory: "Loan App Extortion",
    transferVelocityInrPerMin: 7500,
    hopsCount: 1,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX99201948",
        toAccount: "XX11029384",
        fromBank: "Canara Bank",
        toBank: "Punjab National Bank",
        amount: 45000,
        channel: "UPI",
        utr: "CNRB551920391",
        timeDeltaMinutes: 5
      }
    ],
    originatingAccountAgeDays: 610,
    terminalAccount: "XX11029384",
    terminalHolderName: "Deepak Saini",
    terminalBank: "Punjab National Bank",
    terminalAccountAgeDays: 450,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Kalkaji",
    anchorLat: 28.5398,
    anchorLon: 77.2612,
    proximityToHistoricalHotspotKm: 1.80,
    reportedMinutesAgo: 35,
    targetAtm: {
      atmId: "ATM-DL-KLK-02",
      bankName: "Punjab National Bank",
      operator: "PNB Digital Hub",
      address: "Main Deshbandhu College Rd, Kalkaji, New Delhi",
      latitude: 28.5385,
      longitude: 77.2625,
      distanceKm: 1.20,
      vaultCashInr: 520000,
      singleWithdrawalLimitInr: 10000,
      historicalIncidentCount: 2
    }
  },
  {
    id: "NCRP-2026-88107",
    timestamp: "2026-09-15T17:05:55Z",
    victimName: "Gurpreet Singh",
    victimAccount: "XX33102948",
    victimBank: "State Bank of India",
    stolenAmount: 940000,
    crimeCategory: "Investment Scam",
    transferVelocityInrPerMin: 117500,
    hopsCount: 4,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX33102948",
        toAccount: "XX44910293",
        fromBank: "State Bank of India",
        toBank: "HDFC Bank",
        amount: 940000,
        channel: "RTGS",
        utr: "SBIN882910482",
        timeDeltaMinutes: 1
      },
      {
        hopLevel: 2,
        fromAccount: "XX44910293",
        toAccount: "XX99201948",
        fromBank: "HDFC Bank",
        toBank: "ICICI Bank",
        amount: 940000,
        channel: "IMPS",
        utr: "HDFC771029381",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 3,
        fromAccount: "XX99201948",
        toAccount: "XX66291048",
        fromBank: "ICICI Bank",
        toBank: "Axis Bank",
        amount: 940000,
        channel: "IMPS",
        utr: "ICIC449102938",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 4,
        fromAccount: "XX66291048",
        toAccount: "XX22019284",
        fromBank: "Axis Bank",
        toBank: "State Bank of India",
        amount: 940000,
        channel: "IMPS",
        utr: "UTIB339102948",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1890,
    terminalAccount: "XX22019284",
    terminalHolderName: "Star Global Bullion Agency",
    terminalBank: "State Bank of India",
    terminalAccountAgeDays: 19,
    isDormantReactivated: true,
    dormancyDays: 365,
    anchorArea: "Connaught Place",
    anchorLat: 28.6315,
    anchorLon: 77.2167,
    proximityToHistoricalHotspotKm: 0.08,
    reportedMinutesAgo: 8,
    targetAtm: {
      atmId: "ATM-DL-CP-01",
      bankName: "State Bank of India",
      operator: "SBI e-Corner",
      address: "Inner Circle, Block C, Connaught Place, New Delhi",
      latitude: 28.6321,
      longitude: 77.2174,
      distanceKm: 0.12,
      vaultCashInr: 2200000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 31
    }
  },
  {
    id: "NCRP-2026-88108",
    timestamp: "2026-09-15T17:09:10Z",
    victimName: "Farhan Akhtar",
    victimAccount: "XX77192048",
    victimBank: "Bank of Baroda",
    stolenAmount: 110000,
    crimeCategory: "Job Task Fraud",
    transferVelocityInrPerMin: 18333,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX77192048",
        toAccount: "XX44192038",
        fromBank: "Bank of Baroda",
        toBank: "Canara Bank",
        amount: 110000,
        channel: "UPI",
        utr: "BARB881920391",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 2,
        fromAccount: "XX44192038",
        toAccount: "XX88291048",
        fromBank: "Canara Bank",
        toBank: "Punjab National Bank",
        amount: 110000,
        channel: "IMPS",
        utr: "CNRB449102938",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 520,
    terminalAccount: "XX88291048",
    terminalHolderName: "Manoj Yadav",
    terminalBank: "Punjab National Bank",
    terminalAccountAgeDays: 140,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Okhla Industrial Area Ph-III",
    anchorLat: 28.5355,
    anchorLon: 77.2721,
    proximityToHistoricalHotspotKm: 0.72,
    reportedMinutesAgo: 18,
    targetAtm: {
      atmId: "ATM-DL-OKH-02",
      bankName: "Punjab National Bank",
      operator: "PNB ATM Network",
      address: "Modi Mill Compound, Okhla Phase III, New Delhi",
      latitude: 28.5362,
      longitude: 77.2735,
      distanceKm: 0.65,
      vaultCashInr: 780000,
      singleWithdrawalLimitInr: 15000,
      historicalIncidentCount: 6
    }
  },
  {
    id: "NCRP-2026-88109",
    timestamp: "2026-09-15T17:12:30Z",
    victimName: "Dr. Ananya Roy",
    victimAccount: "XX55192039",
    victimBank: "ICICI Bank",
    stolenAmount: 430000,
    crimeCategory: "Digital Arrest",
    transferVelocityInrPerMin: 53750,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX55192039",
        toAccount: "XX11928374",
        fromBank: "ICICI Bank",
        toBank: "State Bank of India",
        amount: 430000,
        channel: "RTGS",
        utr: "ICIC339102948",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX11928374",
        toAccount: "XX66291048",
        fromBank: "State Bank of India",
        toBank: "Axis Bank",
        amount: 430000,
        channel: "IMPS",
        utr: "SBIN229102938",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 3,
        fromAccount: "XX66291048",
        toAccount: "XX77102938",
        fromBank: "Axis Bank",
        toBank: "HDFC Bank",
        amount: 430000,
        channel: "IMPS",
        utr: "UTIB991029481",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1650,
    terminalAccount: "XX77102938",
    terminalHolderName: "Kuber Finserve Pvt Ltd",
    terminalBank: "HDFC Bank",
    terminalAccountAgeDays: 28,
    isDormantReactivated: true,
    dormancyDays: 215,
    anchorArea: "Greater Kailash I",
    anchorLat: 28.5482,
    anchorLon: 77.2345,
    proximityToHistoricalHotspotKm: 0.22,
    reportedMinutesAgo: 11,
    targetAtm: {
      atmId: "ATM-DL-GK1-01",
      bankName: "HDFC Bank",
      operator: "HDFC Metro Bank",
      address: "M-Block Market, Greater Kailash I, New Delhi",
      latitude: 28.5478,
      longitude: 77.2359,
      distanceKm: 0.25,
      vaultCashInr: 1600000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 16
    }
  },
  {
    id: "NCRP-2026-88110",
    timestamp: "2026-09-15T17:15:45Z",
    victimName: "Nitin Gadgil",
    victimAccount: "XX22102938",
    victimBank: "Kotak Mahindra Bank",
    stolenAmount: 62000,
    crimeCategory: "Loan App Extortion",
    transferVelocityInrPerMin: 10333,
    hopsCount: 1,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX22102938",
        toAccount: "XX99102938",
        fromBank: "Kotak Mahindra Bank",
        toBank: "State Bank of India",
        amount: 62000,
        channel: "UPI",
        utr: "KKBK339102948",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 410,
    terminalAccount: "XX99102938",
    terminalHolderName: "Sanjay Kumar",
    terminalBank: "State Bank of India",
    terminalAccountAgeDays: 580,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Govindpuri",
    anchorLat: 28.5298,
    anchorLon: 77.2645,
    proximityToHistoricalHotspotKm: 1.45,
    reportedMinutesAgo: 28,
    targetAtm: {
      atmId: "ATM-DL-GVP-01",
      bankName: "State Bank of India",
      operator: "SBI Customer Point",
      address: "Main Road Govindpuri, Transit Camp, New Delhi",
      latitude: 28.5310,
      longitude: 77.2631,
      distanceKm: 0.95,
      vaultCashInr: 450000,
      singleWithdrawalLimitInr: 10000,
      historicalIncidentCount: 3
    }
  },
  {
    id: "NCRP-2026-88111",
    timestamp: "2026-09-15T17:18:20Z",
    victimName: "Bhawna Joshi",
    victimAccount: "XX44192038",
    victimBank: "HDFC Bank",
    stolenAmount: 610000,
    crimeCategory: "Investment Scam",
    transferVelocityInrPerMin: 76250,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX44192038",
        toAccount: "XX77192038",
        fromBank: "HDFC Bank",
        toBank: "Canara Bank",
        amount: 610000,
        channel: "RTGS",
        utr: "HDFC229102938",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX77192038",
        toAccount: "XX33910294",
        fromBank: "Canara Bank",
        toBank: "Bank of Baroda",
        amount: 610000,
        channel: "IMPS",
        utr: "CNRB991029481",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 3,
        fromAccount: "XX33910294",
        toAccount: "XX88102938",
        fromBank: "Bank of Baroda",
        toBank: "Axis Bank",
        amount: 610000,
        channel: "IMPS",
        utr: "BARB449102938",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1100,
    terminalAccount: "XX88102938",
    terminalHolderName: "Kuber Commodities Desk",
    terminalBank: "Axis Bank",
    terminalAccountAgeDays: 38,
    isDormantReactivated: true,
    dormancyDays: 280,
    anchorArea: "Green Park / Safdarjung",
    anchorLat: 28.5584,
    anchorLon: 77.2065,
    proximityToHistoricalHotspotKm: 0.19,
    reportedMinutesAgo: 9,
    targetAtm: {
      atmId: "ATM-DL-GRP-01",
      bankName: "Axis Bank",
      operator: "Axis Direct ATM",
      address: "Main Market, Green Park, New Delhi",
      latitude: 28.5592,
      longitude: 77.2052,
      distanceKm: 0.28,
      vaultCashInr: 1350000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 17
    }
  },
  {
    id: "NCRP-2026-88112",
    timestamp: "2026-09-15T17:21:40Z",
    victimName: "Tariq Mansoor",
    victimAccount: "XX77291048",
    victimBank: "State Bank of India",
    stolenAmount: 135000,
    crimeCategory: "SIM Swap",
    transferVelocityInrPerMin: 22500,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX77291048",
        toAccount: "XX11920384",
        fromBank: "State Bank of India",
        toBank: "ICICI Bank",
        amount: 135000,
        channel: "IMPS",
        utr: "SBIN559102938",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 2,
        fromAccount: "XX11920384",
        toAccount: "XX44810293",
        fromBank: "ICICI Bank",
        toBank: "Punjab National Bank",
        amount: 135000,
        channel: "UPI",
        utr: "ICIC881920391",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 730,
    terminalAccount: "XX44810293",
    terminalHolderName: "Irfan Khan",
    terminalBank: "Punjab National Bank",
    terminalAccountAgeDays: 160,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Bhogal / Jangpura",
    anchorLat: 28.5812,
    anchorLon: 77.2489,
    proximityToHistoricalHotspotKm: 0.82,
    reportedMinutesAgo: 19,
    targetAtm: {
      atmId: "ATM-DL-BHG-01",
      bankName: "Punjab National Bank",
      operator: "PNB ATM Center",
      address: "Bhogal Bazaar Lane, Jungpura, New Delhi",
      latitude: 28.5820,
      longitude: 77.2475,
      distanceKm: 0.55,
      vaultCashInr: 820000,
      singleWithdrawalLimitInr: 15000,
      historicalIncidentCount: 7
    }
  },
  {
    id: "NCRP-2026-88113",
    timestamp: "2026-09-15T17:24:10Z",
    victimName: "Shruti Aggarwal",
    victimAccount: "XX88192038",
    victimBank: "Punjab National Bank",
    stolenAmount: 290000,
    crimeCategory: "Job Task Fraud",
    transferVelocityInrPerMin: 36250,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX88192038",
        toAccount: "XX55291048",
        fromBank: "Punjab National Bank",
        toBank: "State Bank of India",
        amount: 290000,
        channel: "IMPS",
        utr: "PUNB229102938",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 2,
        fromAccount: "XX55291048",
        toAccount: "XX99102948",
        fromBank: "State Bank of India",
        toBank: "Canara Bank",
        amount: 290000,
        channel: "IMPS",
        utr: "SBIN991029481",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 680,
    terminalAccount: "XX99102948",
    terminalHolderName: "Balaji Trading Services",
    terminalBank: "Canara Bank",
    terminalAccountAgeDays: 52,
    isDormantReactivated: true,
    dormancyDays: 140,
    anchorArea: "South Extension Part II",
    anchorLat: 28.5672,
    anchorLon: 77.2198,
    proximityToHistoricalHotspotKm: 0.35,
    reportedMinutesAgo: 13,
    targetAtm: {
      atmId: "ATM-DL-SE2-01",
      bankName: "Canara Bank",
      operator: "Canara Bank Network",
      address: "Main Market, South Extension Part II, New Delhi",
      latitude: 28.5665,
      longitude: 77.2210,
      distanceKm: 0.38,
      vaultCashInr: 1100000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 11
    }
  },
  {
    id: "NCRP-2026-88114",
    timestamp: "2026-09-15T17:27:00Z",
    victimName: "Harish Chandra",
    victimAccount: "XX66192048",
    victimBank: "Union Bank of India",
    stolenAmount: 55000,
    crimeCategory: "Loan App Extortion",
    transferVelocityInrPerMin: 6875,
    hopsCount: 1,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX66192048",
        toAccount: "XX22910482",
        fromBank: "Union Bank of India",
        toBank: "Bank of Baroda",
        amount: 55000,
        channel: "UPI",
        utr: "UBIN449102938",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 920,
    terminalAccount: "XX22910482",
    terminalHolderName: "Kamlesh Devi",
    terminalBank: "Bank of Baroda",
    terminalAccountAgeDays: 610,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Mehrauli",
    anchorLat: 28.5178,
    anchorLon: 77.1824,
    proximityToHistoricalHotspotKm: 2.10,
    reportedMinutesAgo: 40,
    targetAtm: {
      atmId: "ATM-DL-MEH-01",
      bankName: "Bank of Baroda",
      operator: "BOB Express",
      address: "Near Qutub Minar Complex Road, Mehrauli, New Delhi",
      latitude: 28.5190,
      longitude: 77.1810,
      distanceKm: 1.45,
      vaultCashInr: 490000,
      singleWithdrawalLimitInr: 10000,
      historicalIncidentCount: 2
    }
  },
  {
    id: "NCRP-2026-88115",
    timestamp: "2026-09-15T17:30:15Z",
    victimName: "Vandana Sethi",
    victimAccount: "XX33910284",
    victimBank: "ICICI Bank",
    stolenAmount: 850000,
    crimeCategory: "Digital Arrest",
    transferVelocityInrPerMin: 106250,
    hopsCount: 4,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX33910284",
        toAccount: "XX88192039",
        fromBank: "ICICI Bank",
        toBank: "State Bank of India",
        amount: 850000,
        channel: "RTGS",
        utr: "ICIC882910482",
        timeDeltaMinutes: 1
      },
      {
        hopLevel: 2,
        fromAccount: "XX88192039",
        toAccount: "XX44192038",
        fromBank: "State Bank of India",
        toBank: "HDFC Bank",
        amount: 850000,
        channel: "IMPS",
        utr: "SBIN771029381",
        timeDeltaMinutes: 3
      },
      {
        hopLevel: 3,
        fromAccount: "XX44192038",
        toAccount: "XX99201948",
        fromBank: "HDFC Bank",
        toBank: "Punjab National Bank",
        amount: 850000,
        channel: "IMPS",
        utr: "HDFC449102938",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 4,
        fromAccount: "XX99201948",
        toAccount: "XX55019283",
        fromBank: "Punjab National Bank",
        toBank: "Axis Bank",
        amount: 850000,
        channel: "IMPS",
        utr: "PUNB339102948",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 2100,
    terminalAccount: "XX55019283",
    terminalHolderName: "Global Tech Clearing Corp",
    terminalBank: "Axis Bank",
    terminalAccountAgeDays: 15,
    isDormantReactivated: true,
    dormancyDays: 410,
    anchorArea: "Vasant Kunj",
    anchorLat: 28.5298,
    anchorLon: 77.1512,
    proximityToHistoricalHotspotKm: 0.12,
    reportedMinutesAgo: 5,
    targetAtm: {
      atmId: "ATM-DL-VK-01",
      bankName: "Axis Bank",
      operator: "Axis ATM Hub",
      address: "Ambience Mall Commercial Belt, Vasant Kunj, New Delhi",
      latitude: 28.5305,
      longitude: 77.1525,
      distanceKm: 0.16,
      vaultCashInr: 1950000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 22
    }
  },
  {
    id: "NCRP-2026-88116",
    timestamp: "2026-09-15T17:33:45Z",
    victimName: "Rajiv Khosla",
    victimAccount: "XX55192038",
    victimBank: "Canara Bank",
    stolenAmount: 210000,
    crimeCategory: "SIM Swap",
    transferVelocityInrPerMin: 35000,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX55192038",
        toAccount: "XX88291048",
        fromBank: "Canara Bank",
        toBank: "Kotak Mahindra Bank",
        amount: 210000,
        channel: "IMPS",
        utr: "CNRB339102948",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX88291048",
        toAccount: "XX22102938",
        fromBank: "Kotak Mahindra Bank",
        toBank: "State Bank of India",
        amount: 210000,
        channel: "UPI",
        utr: "KKBK991029481",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 670,
    terminalAccount: "XX22102938",
    terminalHolderName: "Naresh Goel",
    terminalBank: "State Bank of India",
    terminalAccountAgeDays: 290,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Chirag Delhi",
    anchorLat: 28.5385,
    anchorLon: 77.2289,
    proximityToHistoricalHotspotKm: 0.48,
    reportedMinutesAgo: 17,
    targetAtm: {
      atmId: "ATM-DL-CD-01",
      bankName: "State Bank of India",
      operator: "SBI ATM",
      address: "BRT Corridor Intersection, Chirag Delhi, New Delhi",
      latitude: 28.5392,
      longitude: 77.2295,
      distanceKm: 0.35,
      vaultCashInr: 920000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 9
    }
  },
  {
    id: "NCRP-2026-88117",
    timestamp: "2026-09-15T17:36:12Z",
    victimName: "Sanjay Singhania",
    victimAccount: "XX11920384",
    victimBank: "HDFC Bank",
    stolenAmount: 490000,
    crimeCategory: "Investment Scam",
    transferVelocityInrPerMin: 61250,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX11920384",
        toAccount: "XX44910293",
        fromBank: "HDFC Bank",
        toBank: "Axis Bank",
        amount: 490000,
        channel: "RTGS",
        utr: "HDFC881920391",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX44910293",
        toAccount: "XX77192038",
        fromBank: "Axis Bank",
        toBank: "Punjab National Bank",
        amount: 490000,
        channel: "IMPS",
        utr: "UTIB449102938",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 3,
        fromAccount: "XX77192038",
        toAccount: "XX33102948",
        fromBank: "Punjab National Bank",
        toBank: "Canara Bank",
        amount: 490000,
        channel: "IMPS",
        utr: "PUNB991029481",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1350,
    terminalAccount: "XX33102948",
    terminalHolderName: "Venkatesh Overseas Tradelink",
    terminalBank: "Canara Bank",
    terminalAccountAgeDays: 41,
    isDormantReactivated: true,
    dormancyDays: 230,
    anchorArea: "Alaknanda",
    anchorLat: 28.5321,
    anchorLon: 77.2489,
    proximityToHistoricalHotspotKm: 0.25,
    reportedMinutesAgo: 12,
    targetAtm: {
      atmId: "ATM-DL-ALK-01",
      bankName: "Canara Bank",
      operator: "Canara Bank e-Lounge",
      address: "Tara Apartment Market, Alaknanda, New Delhi",
      latitude: 28.5315,
      longitude: 77.2501,
      distanceKm: 0.29,
      vaultCashInr: 1050000,
      singleWithdrawalLimitInr: 20000,
      historicalIncidentCount: 12
    }
  },
  {
    id: "NCRP-2026-88118",
    timestamp: "2026-09-15T17:39:50Z",
    victimName: "Priyanka Nambiar",
    victimAccount: "XX44019283",
    victimBank: "State Bank of India",
    stolenAmount: 85000,
    crimeCategory: "Job Task Fraud",
    transferVelocityInrPerMin: 14166,
    hopsCount: 2,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX44019283",
        toAccount: "XX88192049",
        fromBank: "State Bank of India",
        toBank: "Bank of Baroda",
        amount: 85000,
        channel: "UPI",
        utr: "SBIN339102948",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX88192049",
        toAccount: "XX22192038",
        fromBank: "Bank of Baroda",
        toBank: "Union Bank of India",
        amount: 85000,
        channel: "IMPS",
        utr: "BARB991029481",
        timeDeltaMinutes: 6
      }
    ],
    originatingAccountAgeDays: 590,
    terminalAccount: "XX22192038",
    terminalHolderName: "Subhash Chand",
    terminalBank: "Union Bank of India",
    terminalAccountAgeDays: 240,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Khanpur",
    anchorLat: 28.5142,
    anchorLon: 77.2341,
    proximityToHistoricalHotspotKm: 1.05,
    reportedMinutesAgo: 24,
    targetAtm: {
      atmId: "ATM-DL-KHP-01",
      bankName: "Union Bank of India",
      operator: "UBI QuickCash",
      address: "Devli Road, Khanpur Extension, New Delhi",
      latitude: 28.5135,
      longitude: 77.2355,
      distanceKm: 0.78,
      vaultCashInr: 580000,
      singleWithdrawalLimitInr: 10000,
      historicalIncidentCount: 5
    }
  },
  {
    id: "NCRP-2026-88119",
    timestamp: "2026-09-15T17:42:30Z",
    victimName: "Manish Poddar",
    victimAccount: "XX99102938",
    victimBank: "Axis Bank",
    stolenAmount: 670000,
    crimeCategory: "Digital Arrest",
    transferVelocityInrPerMin: 83750,
    hopsCount: 3,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX99102938",
        toAccount: "XX33102948",
        fromBank: "Axis Bank",
        toBank: "HDFC Bank",
        amount: 670000,
        channel: "RTGS",
        utr: "UTIB229102938",
        timeDeltaMinutes: 2
      },
      {
        hopLevel: 2,
        fromAccount: "XX33102948",
        toAccount: "XX66192048",
        fromBank: "HDFC Bank",
        toBank: "State Bank of India",
        amount: 670000,
        channel: "IMPS",
        utr: "HDFC991029481",
        timeDeltaMinutes: 5
      },
      {
        hopLevel: 3,
        fromAccount: "XX66192048",
        toAccount: "XX11928374",
        fromBank: "State Bank of India",
        toBank: "ICICI Bank",
        amount: 670000,
        channel: "IMPS",
        utr: "SBIN449102938",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 1480,
    terminalAccount: "XX11928374",
    terminalHolderName: "M/s Orient Gold Exim",
    terminalBank: "ICICI Bank",
    terminalAccountAgeDays: 33,
    isDormantReactivated: true,
    dormancyDays: 320,
    anchorArea: "Defence Colony",
    anchorLat: 28.5742,
    anchorLon: 77.2312,
    proximityToHistoricalHotspotKm: 0.16,
    reportedMinutesAgo: 7,
    targetAtm: {
      atmId: "ATM-DL-DEF-01",
      bankName: "ICICI Bank",
      operator: "ICICI TouchPoint",
      address: "Flyover Market, Defence Colony, New Delhi",
      latitude: 28.5750,
      longitude: 77.2301,
      distanceKm: 0.21,
      vaultCashInr: 1750000,
      singleWithdrawalLimitInr: 25000,
      historicalIncidentCount: 20
    }
  },
  {
    id: "NCRP-2026-88120",
    timestamp: "2026-09-15T17:45:00Z",
    victimName: "Kavita Ramachandran",
    victimAccount: "XX55291048",
    victimBank: "State Bank of India",
    stolenAmount: 51000,
    crimeCategory: "Loan App Extortion",
    transferVelocityInrPerMin: 6375,
    hopsCount: 1,
    chain: [
      {
        hopLevel: 1,
        fromAccount: "XX55291048",
        toAccount: "XX88102938",
        fromBank: "State Bank of India",
        toBank: "Punjab National Bank",
        amount: 51000,
        channel: "UPI",
        utr: "SBIN119203847",
        timeDeltaMinutes: 8
      }
    ],
    originatingAccountAgeDays: 850,
    terminalAccount: "XX88102938",
    terminalHolderName: "Sunil Srivastav",
    terminalBank: "Punjab National Bank",
    terminalAccountAgeDays: 490,
    isDormantReactivated: false,
    dormancyDays: 0,
    anchorArea: "Tughlakabad Extension",
    anchorLat: 28.5089,
    anchorLon: 77.2689,
    proximityToHistoricalHotspotKm: 1.60,
    reportedMinutesAgo: 38,
    targetAtm: {
      atmId: "ATM-DL-TGH-01",
      bankName: "Punjab National Bank",
      operator: "PNB ATM Branch",
      address: "Main Gali No 5, Tughlakabad Ext, New Delhi",
      latitude: 28.5098,
      longitude: 77.2675,
      distanceKm: 1.10,
      vaultCashInr: 390000,
      singleWithdrawalLimitInr: 10000,
      historicalIncidentCount: 3
    }
  }
];
