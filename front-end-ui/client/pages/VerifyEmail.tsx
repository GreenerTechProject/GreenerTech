
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle } from "lucide-react";


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
    <div className="min-h-screen bg-gradient-to-br from-[#EAF4E1] via-[#FCFEFF] to-[#EAF4E1] flex flex-col lg:flex-row">
      {/* Background Image Section */}
      <div className="hidden lg:block flex-1 relative min-h-[40vh] lg:min-h-screen">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fe15cdeeaccbb4f9394b3b7b30742eb8c%2F97c345a448194346ad4e8ebc4b57f88f?format=webp&width=1200"
          alt="Agriculture intelligente"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Verification Form Section */}
      <div className="w-full lg:w-[845px] bg-white/95 backdrop-blur lg:rounded-l-[28px] shadow-xl flex flex-col items-center justify-center px-6 sm:px-8 py-10 lg:py-12 min-h-screen">
        {/* Greener Tech Logo */}
        <div className="mb-6 lg:mb-8">
          <img
            src="/GreenerTech-Logo4T.png"
            alt="Greener Tech Logo"
            className="w-[220px] sm:w-[260px] lg:w-[320px] h-auto mx-auto"
          />
        </div>
        <p className="text-center text-gray-600 mb-8">
          Rejoignez la révolution verte avec GreenerTech
        </p>

        {/* Verification Content */}
        <div className="w-full max-w-[416px] text-center">
          {/* Icon / Loader */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-green-100 shadow-lg">
            {status === "loading" && (
              // Spinner
              <svg
                className="animate-spin h-8 w-8 text-[#2E7D32]"
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
              <CheckCircle className="w-8 h-8 text-[#2E7D32] drop-shadow-sm" />
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
                className="px-6 py-3 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#276A2B] transition-colors shadow-md hover:shadow-lg"
              >
                Go to Login
              </button>
            )}

            {status === "success" && (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 text-[#2E7D32] hover:text-[#276A2B] font-medium rounded-lg border border-[#2E7D32] hover:bg-[#2E7D32] hover:text-white transition-colors"
              >
                Home
              </button>
            )}

            {status === "error" && (
              <>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#276A2B] transition-colors shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 text-[#2E7D32] hover:text-[#276A2B] font-medium rounded-lg border border-[#2E7D32] hover:bg-[#2E7D32] hover:text-white transition-colors"
                >
                  Home
                </button>
              </>
            )}

            {status === "missing" && (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 text-[#2E7D32] hover:text-[#276A2B] font-medium rounded-lg border border-[#2E7D32] hover:bg-[#2E7D32] hover:text-white transition-colors"
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
