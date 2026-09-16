import re
import requests
from typing import Dict, Any, Optional, Tuple

RAZORPAY_IFSC_API_BASE = "https://ifsc.razorpay.com"

# Comprehensive District / City / Locality Geo-Centroids for Indian KYC Branches
INDIAN_GEO_REGISTRY: Dict[str, Tuple[float, float]] = {
    # South Delhi & Delhi NCR Localities (High-Precision Interdiction Anchors)
    "MALVIYA NAGAR": (28.5368, 77.2107),
    "SAKET": (28.5243, 77.2162),
    "LAJPAT NAGAR": (28.5678, 77.2464),
    "NEHRU PLACE": (28.5485, 77.2528),
    "HAUZ KHAS": (28.5580, 77.2078),
    "GREEN PARK": (28.5600, 77.2051),
    "CR PARK": (28.5405, 77.2443),
    "CHITTARANJAN PARK": (28.5405, 77.2443),
    "GREATER KAILASH": (28.5505, 77.2346),
    "MEHRAULI": (28.5230, 77.1788),
    "SOUTH EXTENSION": (28.5677, 77.2246),
    "SOUTH EXT": (28.5677, 77.2246),
    "CONNAUGHT PLACE": (28.6315, 77.2167),
    "KAROL BAGH": (28.6514, 77.1907),
    "LAXMI NAGAR": (28.6328, 77.2790),
    "EAST DELHI": (28.6328, 77.2790),
    "SOUTH DELHI": (28.5368, 77.2107),
    "NEW DELHI": (28.6139, 77.2090),
    "DELHI": (28.6139, 77.2090),
    "NOIDA": (28.5708, 77.3260),
    "GURGAON": (28.4595, 77.0266),
    "GURUGRAM": (28.4595, 77.0266),
    "FARIDABAD": (28.4089, 77.3178),
    "GHAZIABAD": (28.6692, 77.4538),

    # Mumbai Metropolitan Region Localities
    "NARIMAN POINT": (18.9260, 72.8230),
    "ANDHERI": (19.1136, 72.8697),
    "BANDRA": (19.0596, 72.8295),
    "BKC": (19.0657, 72.8687),
    "BANDRA KURLA COMPLEX": (19.0657, 72.8687),
    "DADAR": (19.0178, 72.8478),
    "FORT": (18.9322, 72.8347),
    "MUMBAI": (19.0760, 72.8777),
    "GREATER MUMBAI": (19.0760, 72.8777),
    "THANE": (19.2183, 72.9781),
    "NAVI MUMBAI": (19.0330, 73.0297),

    # Major Metros & State Capitals
    "JAIPUR": (26.9124, 75.7873),
    "MI ROAD": (26.9185, 75.8142),
    "BENGALURU": (12.9716, 77.5946),
    "BANGALORE": (12.9716, 77.5946),
    "INDIRANAGAR": (12.9784, 77.6408),
    "WHITEFIELD": (12.9698, 77.7500),
    "HYDERABAD": (17.3850, 78.4867),
    "SECUNDERABAD": (17.4399, 78.4983),
    "HITECH CITY": (17.4435, 78.3772),
    "CHENNAI": (13.0827, 80.2707),
    "KOLKATA": (22.5726, 88.3639),
    "SALT LAKE": (22.5868, 88.4178),
    "AHMEDABAD": (23.0225, 72.5714),
    "PUNE": (18.5204, 73.8567),
    "LUCKNOW": (26.8467, 80.9462),
    "PATNA": (25.5941, 85.1376),
    "BHOPAL": (23.2599, 77.4126),
    "INDORE": (22.7196, 75.8577),
    "CHANDIGARH": (30.7333, 76.7794),
    "BHUBANESWAR": (20.2961, 85.8245),
    "GUWAHATI": (26.1445, 91.7362),
    "KOCHI": (9.9312, 76.2673),
    "THIRUVANANTHAPURAM": (8.5241, 76.9366),
    "RANCHI": (23.3441, 85.3096),

    # High-Risk Cybercrime Syndicates & Mule Operative Corridors
    "JAMTARA": (23.9610, 86.8010),
    "NUH": (28.1065, 77.0120),
    "MEWAT": (28.1065, 77.0120),
    "BHARATPUR": (27.2152, 77.5030),
    "DEOGHAR": (24.4826, 86.7000),
    "GIRIDIH": (24.1892, 86.3025),
    "ALWAR": (27.5530, 76.6346),
    "MATHURA": (27.4924, 77.6737)
}

# Indian Postal PIN Code 2-digit Regional Centroids (Geographic Anchor Fallbacks)
PIN_PREFIX_REGISTRY: Dict[str, Tuple[float, float]] = {
    "11": (28.6139, 77.2090),  # Delhi
    "12": (28.4595, 77.0266),  # Haryana (Gurugram/Faridabad)
    "13": (30.3782, 76.7767),  # Haryana (Ambala/North)
    "14": (30.9010, 75.8573),  # Punjab (Ludhiana)
    "15": (30.2110, 74.9455),  # Punjab (Bathinda)
    "16": (30.7333, 76.7794),  # Chandigarh
    "17": (31.1048, 77.1734),  # Himachal Pradesh
    "18": (32.7266, 74.8570),  # Jammu
    "19": (34.0837, 74.7973),  # Srinagar / Kashmir
    "20": (27.8974, 78.0880),  # UP (Aligarh)
    "21": (25.4358, 81.8463),  # UP (Prayagraj)
    "22": (26.8467, 80.9462),  # UP (Lucknow)
    "23": (25.3176, 82.9739),  # UP (Varanasi)
    "24": (30.3165, 78.0322),  # Uttarakhand (Dehradun)
    "25": (28.9845, 77.7064),  # UP (Meerut)
    "28": (27.1767, 78.0081),  # UP (Agra)
    "30": (26.9124, 75.7873),  # Rajasthan (Jaipur)
    "31": (24.5854, 73.7125),  # Rajasthan (Udaipur)
    "32": (25.2138, 75.8648),  # Rajasthan (Kota)
    "33": (28.0229, 73.3119),  # Rajasthan (Bikaner)
    "34": (26.2389, 73.0243),  # Rajasthan (Jodhpur)
    "36": (22.3039, 70.8022),  # Gujarat (Rajkot)
    "38": (23.0225, 72.5714),  # Gujarat (Ahmedabad)
    "39": (21.1702, 72.8311),  # Gujarat (Surat)
    "40": (19.0760, 72.8777),  # Maharashtra (Mumbai)
    "41": (18.5204, 73.8567),  # Maharashtra (Pune)
    "42": (19.9975, 73.7898),  # Maharashtra (Nashik)
    "44": (21.1458, 79.0882),  # Maharashtra (Nagpur)
    "45": (22.7196, 75.8577),  # MP (Indore)
    "46": (23.2599, 77.4126),  # MP (Bhopal)
    "49": (21.2514, 81.6296),  # Chhattisgarh (Raipur)
    "50": (17.3850, 78.4867),  # Telangana (Hyderabad)
    "52": (16.5062, 80.6480),  # AP (Vijayawada)
    "53": (17.6868, 83.2185),  # AP (Visakhapatnam)
    "56": (12.9716, 77.5946),  # Karnataka (Bengaluru)
    "57": (12.9141, 74.8560),  # Karnataka (Mangaluru)
    "60": (13.0827, 80.2707),  # Tamil Nadu (Chennai)
    "62": (9.9252, 78.1198),   # Tamil Nadu (Madurai)
    "64": (11.0168, 76.9558),  # Tamil Nadu (Coimbatore)
    "67": (11.2588, 75.7804),  # Kerala (Kozhikode)
    "68": (9.9312, 76.2673),   # Kerala (Kochi)
    "69": (8.5241, 76.9366),   # Kerala (Thiruvananthapuram)
    "70": (22.5726, 88.3639),  # West Bengal (Kolkata)
    "75": (20.2961, 85.8245),  # Odisha (Bhubaneswar)
    "78": (26.1445, 91.7362),  # Assam (Guwahati)
    "80": (25.5941, 85.1376),  # Bihar (Patna)
    "83": (23.3441, 85.3096),  # Jharkhand (Ranchi)
    "86": (23.9610, 86.8010),  # Jharkhand (Jamtara/Dhanbad)
}


class KYCGeolocator:
    """
    Resolves official Bank Branch details and KYC GPS coordinates
    via Razorpay open-source IFSC API (https://ifsc.razorpay.com/{IFSC_CODE})
    and multi-tier geospatial map lookup.
    """
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def fetch_ifsc_details(self, ifsc_code: str) -> Optional[Dict[str, Any]]:
        """
        Queries Razorpay open-source IFSC endpoint for branch metadata.
        API Format: https://ifsc.razorpay.com/{IFSC_CODE}
        """
        code = ifsc_code.strip().upper()
        if code in self._cache:
            return self._cache[code]

        url = f"{RAZORPAY_IFSC_API_BASE}/{code}"
        try:
            resp = requests.get(url, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                self._cache[code] = data
                return data
        except Exception as e:
            print(f"[Razorpay IFSC API Warning]: Failed to fetch {code} ({e})")
        return None

    def resolve_branch_coordinates(
        self,
        ifsc_code: str,
        fallback_lat: float = 28.5368,
        fallback_lon: float = 77.2107
    ) -> Dict[str, Any]:
        """
        Extracts bank name, branch address, city, and state from Razorpay IFSC API.
        Attaches latitude and longitude to the terminal mule's registered branch
        using high-resolution locality matching, postal pin heuristics, and spatial anchors.
        """
        code = ifsc_code.strip().upper()
        data = self.fetch_ifsc_details(code)

        if data:
            bank = data.get("BANK", "Public Sector Bank")
            branch = data.get("BRANCH", "Main Branch")
            address = data.get("ADDRESS", "")
            city = (data.get("CITY") or data.get("DISTRICT") or data.get("CENTRE") or "").upper().strip()
            state = data.get("STATE", "")
            upi_enabled = data.get("UPI", True)
            rtgs_enabled = data.get("RTGS", True)
            neft_enabled = data.get("NEFT", True)
            imps_enabled = data.get("IMPS", True)
            micr = data.get("MICR", "")

            # Extract 6-digit Indian PIN Code from address or city
            pincode = None
            pin_match = re.search(r'\b[1-9][0-9]{2}\s?[0-9]{3}\b', address)
            if pin_match:
                pincode = pin_match.group(0).replace(" ", "")

            # Tier 1: Match high-priority locality / neighborhood in branch name or address
            text_to_search = f"{branch} {address} {city}".upper()
            coords: Optional[Tuple[float, float]] = None
            lookup_source = "DEFAULT_FALLBACK"

            for locality, loc_coords in INDIAN_GEO_REGISTRY.items():
                if locality in text_to_search:
                    coords = loc_coords
                    lookup_source = f"GEO_REGISTRY_LOCALITY_{locality}"
                    break

            # Tier 2: Match city or district centroid
            if not coords and city in INDIAN_GEO_REGISTRY:
                coords = INDIAN_GEO_REGISTRY[city]
                lookup_source = f"GEO_REGISTRY_CITY_{city}"

            # Tier 3: Match Postal PIN Code 2-digit Regional Prefix
            if not coords and pincode:
                prefix = pincode[:2]
                if prefix in PIN_PREFIX_REGISTRY:
                    coords = PIN_PREFIX_REGISTRY[prefix]
                    lookup_source = f"PINCODE_PREFIX_{prefix}XX"

            # Tier 4: Fuzzy state matching across registry
            if not coords:
                for reg_key, reg_coords in INDIAN_GEO_REGISTRY.items():
                    if reg_key in state.upper():
                        coords = reg_coords
                        lookup_source = f"GEO_REGISTRY_STATE_{reg_key}"
                        break

            lat, lon = coords if coords else (fallback_lat, fallback_lon)
            if not coords:
                lookup_source = "NATIONAL_CENTROID_FALLBACK"

            return {
                "ifsc": code,
                "bank": bank,
                "branch": f"{branch}, {city}",
                "address": address,
                "city": city,
                "state": state,
                "pincode": pincode or "NOT_SPECIFIED",
                "micr": micr,
                "upi_supported": upi_enabled,
                "rtgs_supported": rtgs_enabled,
                "neft_supported": neft_enabled,
                "imps_supported": imps_enabled,
                "lat": lat,
                "lon": lon,
                "geocoding_source": lookup_source,
                "source": "RAZORPAY_IFSC_API_LIVE"
            }

        # Offline / Fallback mapping for core demo hubs if network is disabled
        fallback_registry = {
            "SBIN0001493": ("State Bank of India", "Malviya Nagar Branch, South Delhi", "E-1/11 Malviya Nagar, New Delhi 110017", "New Delhi", "Delhi", "110017", 28.5368, 77.2107),
            "SBIN0001234": ("State Bank of India", "Laxmi Nagar Main Branch, East Delhi", "Vikas Marg, Laxmi Nagar, Delhi 110092", "Delhi", "Delhi", "110092", 28.6328, 77.2790),
            "HDFC0005678": ("HDFC Bank", "Sector 18, Noida", "G-Block, Sector 18, Noida 201301", "Noida", "Uttar Pradesh", "201301", 28.5708, 77.3260),
            "ICIC0009101": ("ICICI Bank", "Andheri East Kurla Road, Mumbai", "Andheri Kurla Rd, Mumbai 400059", "Mumbai", "Maharashtra", "400059", 19.1136, 72.8697),
            "PUNB0002345": ("Punjab National Bank", "Nuh Highway Branch, Mewat", "Delhi-Alwar Highway, Nuh 122107", "Nuh", "Haryana", "122107", 28.1065, 77.0120),
            "BARB0007890": ("Bank of Baroda", "Jamtara Main Bazaar, Jharkhand", "Main Road, Jamtara 815351", "Jamtara", "Jharkhand", "815351", 23.9610, 86.8010),
            "SBIN0000656": ("State Bank of India", "MI Road Special Branch, Jaipur", "MI Road, Jaipur 302001", "Jaipur", "Rajasthan", "302001", 26.9185, 75.8142),
            "HDFC0000001": ("HDFC Bank", "Nariman Point Branch, Mumbai", "Tulsiani Chambers, Nariman Point, Mumbai 400021", "Mumbai", "Maharashtra", "400021", 18.9260, 72.8230)
        }

        f_data = fallback_registry.get(
            code,
            ("Nationalized Bank", f"Branch {code}", f"Registered Branch {code}", "Metropolitan Hub", "India", "110001", fallback_lat, fallback_lon)
        )

        return {
            "ifsc": code,
            "bank": f_data[0],
            "branch": f_data[1],
            "address": f_data[2],
            "city": f_data[3],
            "state": f_data[4],
            "pincode": f_data[5],
            "micr": "",
            "upi_supported": True,
            "rtgs_supported": True,
            "neft_supported": True,
            "imps_supported": True,
            "lat": f_data[6],
            "lon": f_data[7],
            "geocoding_source": "INTERNAL_KYC_CACHE_BENCHMARK",
            "source": "INTERNAL_KYC_CACHE"
        }

