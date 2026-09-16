import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      incidentId = "NCRP-2024-8841",
      patrolPhone = "7011274533",
      patrolUnitId = "PCR-ALPHA-402",
      stolenAmount = 85000,
      targetAtm = {
        atm_id: "ATM-SBI-SAK-01",
        bank_name: "State Bank of India",
        address: "Community Centre, Block M, Saket, New Delhi",
        latitude: 28.5244,
        longitude: 77.2066,
        distance_km: 0.4
      },
      officerNotes = "Immediate physical interdiction required before cash dispense."
    } = body;

    const cleanPhone = patrolPhone.replace("+91", "").replace(/\D/g, "").trim();
    const googleMapsUrl = `https://maps.google.com/?q=${targetAtm.latitude},${targetAtm.longitude}`;

    const smsMessage = `[CYBERSURAKSHA LEA DISPATCH]
URGENT INTERDICTION REQUIRED
Incident: ${incidentId}
Target: ${targetAtm.bank_name} ATM (${targetAtm.atm_id})
Coordinates: ${targetAtm.latitude}, ${targetAtm.longitude}
Location: ${targetAtm.address}
Distance: ${targetAtm.distance_km || 0.4} km
Cash Risk: INR ${Number(stolenAmount).toLocaleString("en-IN")}
Unit: ${patrolUnitId}
GPS Navigation: ${googleMapsUrl}`;

    let fast2smsId: string | null = null;
    let dispatchStatus = "FAILED";
    let statusMessage = "";

    if (FAST2SMS_API_KEY && cleanPhone.length === 10) {
      try {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": FAST2SMS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "q",
            message: smsMessage,
            language: "english",
            flash: 0,
            numbers: cleanPhone
          })
        });

        const resData = await res.json();
        if (res.ok && resData.return) {
          fast2smsId = resData.request_id || `sms-${Date.now()}`;
          dispatchStatus = "DISPATCHED_LIVE";
          statusMessage = `Tactical interdiction SMS dispatched to Police Patrol unit at ${cleanPhone} (Request ID: ${fast2smsId})`;
        } else {
          // Fast2SMS API error or recharge notice
          const apiMsg = resData.message || JSON.stringify(resData);
          dispatchStatus = "RECHARGE_REQUIRED";
          statusMessage = `Fast2SMS Gateway Notice: ${apiMsg}`;
        }
      } catch (err: any) {
        dispatchStatus = "FAILED_NETWORK";
        statusMessage = `Network error calling Fast2SMS: ${err.message}`;
      }
    } else {
      statusMessage = "Invalid phone number or FAST2SMS_API_KEY not configured.";
    }

    // Persist into Supabase PostgreSQL (dispatch_logs)
    try {
      await supabase.from("dispatch_logs").insert([{
        incident_id: incidentId,
        dispatch_type: "PATROL_SMS",
        recipient: `+91 ${cleanPhone}`,
        status: dispatchStatus,
        external_provider_id: fast2smsId,
        payload_summary: `Patrol dispatch for ${targetAtm.bank_name} ATM (${targetAtm.latitude}, ${targetAtm.longitude}) to ${cleanPhone}`
      }]);
    } catch (dbErr) {
      console.warn("[Supabase Dispatch Log Warning]:", dbErr);
    }

    return NextResponse.json({
      success: dispatchStatus === "DISPATCHED_LIVE",
      status: dispatchStatus,
      patrolPhone: cleanPhone,
      targetAtm,
      googleMapsUrl,
      smsMessage,
      providerId: fast2smsId,
      message: statusMessage
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e.message || "Failed to process patrol SMS dispatch." },
      { status: 500 }
    );
  }
}
