import { useLocation, Link } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";

export default function EmailVerification() {
  const location = useLocation();
  const email = location.state?.email || "";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Centered Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Greener Tech Logo */}
        <div className="bg-gradient-to-r from-[#D6E2CC] to-[#B4CC5F] px-6 py-8 text-center">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b0dd8ca02c2a41b50f73559714fd5efaaf50e9cf?width=760"
            alt="Greener Tech Logo"
            className="w-48 h-auto mx-auto"
          />
        </div>

        {/* Verification Content */}
        <div className="px-6 py-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
          </div>

          {/* Email Icon and Message */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-700 mb-2 text-sm">
              We sent a verification email to you, please verify your email
            </p>
            {email && (
              <p className="text-xs text-gray-500 font-medium break-all">
                Check your inbox at:{" "}
                <span className="text-[#B4CC5F] font-semibold">{email}</span>
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              What's next?
            </h3>
            <ol className="text-left text-xs text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-[#B4CC5F] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                  1
                </span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-[#B4CC5F] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                  2
                </span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-[#B4CC5F] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                  3
                </span>
                <span>Return to login once verified</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full inline-block bg-[#B4CC5F] text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-[#A3C247] transition-colors"
            >
              Go to Login
            </Link>

            <p className="text-xs text-gray-500">
              Didn't receive the email?{" "}
              <button className="text-[#B4CC5F] hover:text-[#A3C247] transition-colors font-medium underline">
                Resend verification email
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
