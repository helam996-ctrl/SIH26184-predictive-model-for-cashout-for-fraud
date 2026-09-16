import { NextRequest, NextResponse } from "next/server";
import { verifyPendingOtp } from "@/lib/otpStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || "";
    const otp = body.otp || "";

    const check = verifyPendingOtp(phone, otp);

    if (!check.valid) {
      return NextResponse.json(
        { success: false, message: check.reason || "Invalid OTP code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mobile OTP successfully verified."
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error verifying OTP." },
      { status: 500 }
    );
  }
}
