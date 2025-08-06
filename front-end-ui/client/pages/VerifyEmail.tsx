
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";


export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "missing"
  >(() => (token ? "loading" : "missing"));
  const [message, setMessage] = useState(
    token ? "Verification in progress..." : "No token provided."
  );

  // Use environment variable if available, fallback to localhost
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

  const verify = async (abortSignal: AbortSignal) => {
    try {
      setStatus("loading");
      setMessage("Verification in progress...");
      const res = await axios.get(
        `${API_BASE}/api/verify_email?token=${token}`,
        { signal: abortSignal },
      );
      setStatus("success");
      setMessage("Email verified successfully!");
    } catch (err: any) {
      if (axios.isCancel?.(err)) return; // request canceled
      setStatus("error");

      // Provide useful error details when available
      if (err?.response?.data?.message) {
        setMessage(`Verification failed: ${err.response.data.message}`);
      } else if (err?.response?.status) {
        setMessage(
          `Verification failed (code ${err.response.status}). Invalid or expired link.`,
        );
      } else {
        setMessage("Verification failed or link expired.");
      }
    }
  };

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    verify(controller.signal);
    return () => controller.abort();
  }, [token, API_BASE]);

  const handleRetry = () => {
    const controller = new AbortController();
    verify(controller.signal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="p-8 text-center">
          {/* Icon / Loader */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-gray-100">
            {status === "loading" && (
              // Spinner
              <svg
                className="animate-spin h-8 w-8 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"
                />
              </svg>
            )}

            {status === "success" && (
              // Check icon
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}

            {status === "error" && (
              // X icon
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}

            {status === "missing" && (
              // Info icon
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {status === "loading" && "Email Verification"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
            {status === "missing" && "Missing Token"}
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {(status === "success" || status === "missing") && (
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Login
              </button>
            )}

            {status === "success" && (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Home
              </button>
            )}

            {status === "error" && (
              <>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  Home
                </button>
              </>
            )}

            {status === "missing" && (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Home
              </button>
            )}
          </div>

          {status === "error" && (
            <p className="mt-4 text-sm text-gray-500">
              If the link has expired, please request a new verification link.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
