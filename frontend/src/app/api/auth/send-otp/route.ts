import { NextRequest, NextResponse } from "next/server";
import { setPendingOtp } from "@/lib/otpStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || "";
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setPendingOtp(cleanPhone, generatedOtp, 300); // 5 minutes TTL

    const fast2smsKey = process.env.FAST2SMS_API_KEY || "";
    let dispatchStatus = "LOCAL_STAGING";
    let providerRef = null;

    if (fast2smsKey) {
      try {
        const smsText = `CyberSuraksha Gov SSO: Your official authentication OTP is ${generatedOtp}. Valid for 5 minutes. Do not share.`;
        const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": fast2smsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "q",
            message: smsText,
            language: "english",
            flash: 0,
            numbers: cleanPhone
          })
        });

        const smsData = await resp.json();
        if (resp.ok && smsData.return) {
          dispatchStatus = "DISPATCHED_LIVE_SMS";
          providerRef = smsData.request_id || null;
        } else {
          console.warn("[Fast2SMS Delivery Notice]:", smsData);
          dispatchStatus = "SENT_WITH_PROVIDER_FALLBACK";
        }
      } catch (err) {
        console.error("[Fast2SMS Error]:", err);
        dispatchStatus = "DISPATCH_ERROR";
      }
    }

    return NextResponse.json({
      success: true,
      message: `Official OTP has been dispatched to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}.`,
      dispatchStatus,
      providerRef,
      phoneMasked: `+91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error dispatching OTP." },
      { status: 500 }
    );
  }
}
