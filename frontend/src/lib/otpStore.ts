/**
 * CyberSuraksha - In-Memory OTP Store & Validator
 * Holds pending OTP verification sessions with 5-minute TTL.
 */

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// Global reference survives across dev hot-reloads in Next.js
const globalOtpStore = global as unknown as {
  __CYBERSURAKSHA_OTP_STORE__?: Map<string, OtpEntry>;
};

if (!globalOtpStore.__CYBERSURAKSHA_OTP_STORE__) {
  globalOtpStore.__CYBERSURAKSHA_OTP_STORE__ = new Map<string, OtpEntry>();
}

const otpStore = globalOtpStore.__CYBERSURAKSHA_OTP_STORE__;

export function setPendingOtp(phone: string, otp: string, ttlSeconds = 300): void {
  const clean = phone.replace(/\D/g, "").slice(-10);
  otpStore.set(clean, {
    otp,
    expiresAt: Date.now() + ttlSeconds * 1000,
    attempts: 0
  });
}

export function verifyPendingOtp(phone: string, inputOtp: string): { valid: boolean; reason?: string } {
  const clean = phone.replace(/\D/g, "").slice(-10);
  const entry = otpStore.get(clean);

  if (!entry) {
    return { valid: false, reason: "No active OTP request found for this mobile number. Please request a new OTP." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(clean);
    return { valid: false, reason: "OTP has expired. Please request a new code." };
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(clean);
    return { valid: false, reason: "Too many failed attempts. Please request a new OTP." };
  }

  if (entry.otp !== inputOtp.trim()) {
    return { valid: false, reason: "Invalid OTP code entered." };
  }

  // Verification success - clear OTP
  otpStore.delete(clean);
  return { valid: true };
}
