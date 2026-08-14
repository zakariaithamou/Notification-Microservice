"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1); // Step 1: Login, Step 2: OTP, Step 3: Update Password
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Login failed");

      if (result.status === "OTP_REQUIRED") {
        setStep(2);
      } else if (result.status === "LOGGED_IN") {
        // skip the OTP
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Verification failed");

      // Success! The cookie is automatically set by the browser.

      if (result.status === "REQUIRE_NEW_PASSWORD") {
        setStep(3);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to update password");

      // Success! Password updated, timer removed, send them to the dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Notification Microservice
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Authenticate your department
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={
            step === 1
              ? handlePasswordSubmit
              : step === 2
                ? handleOtpSubmit
                : handleNewPasswordSubmit
          }
        >
          <div className="space-y-4 rounded-md shadow-sm">
            {step === 1 && (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-center text-sm font-medium text-gray-700"
                  >
                    Department Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    placeholder="dept@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-center text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-center text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <p className="text-xs text-center text-gray-500 mb-2">
                  We sent a 6-digit code to {email}
                </p>
                <input
                  id="otpCode"
                  type="text"
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Set Permanent Password
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Please change your temporary administrator password to
                    continue.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      disabled={isLoading}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none sm:text-sm disabled:bg-gray-100"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      disabled={isLoading}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none sm:text-sm disabled:bg-gray-100"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {isLoading
                ? "Processing..."
                : step === 1
                  ? "Sign In"
                  : step === 2
                    ? "Verify Code"
                    : "Save & Continue"}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpCode("");
                  setError("");
                }}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
