import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

const roles = [
  { value: "directeur", label: "Directeur" },
  { value: "technicien-superieur", label: "Technicien Supérieur" },
  { value: "technicien", label: "Technicien" },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  const { isLoading: authLoading } = useAuthRedirect();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedRole) {
      // For Directeur, go to normal registration
      if (selectedRole === "directeur") {
        navigate("/register", { state: { role: selectedRole } });
      }
      // For Technicien Supérieur and Technicien, go to new registration flow
      else if (
        selectedRole === "technicien-superieur" ||
        selectedRole === "technicien"
      ) {
        navigate("/technicien-registration", { state: { role: selectedRole } });
      }
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
  };

  const selectedRoleLabel =
    roles.find((role) => role.value === selectedRole)?.label || "Sélectionner un rôle";

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

      {/* Role Selection Form Section */}
      <div className="w-full lg:w-[845px] bg-white/95 backdrop-blur lg:rounded-l-[28px] shadow-xl flex flex-col items-center justify-center px-6 sm:px-8 py-10 lg:py-12 min-h-screen">
        {/* Greener Tech Logo */}
        <div className="mb-6 lg:mb-8">
          <img
            src="/GreenerTech-Logo.jpg"
            alt="Greener Tech Logo"
            className="w-[220px] sm:w-[260px] lg:w-[320px] h-auto"
          />
        </div>
        <p className="text-center text-gray-600 mb-8">
          Rejoignez la révolution verte avec GreenerTech 🌱
        </p>

        {/* Role Selection Form */}
        <div className="w-full max-w-[416px]">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Commencer l'inscription
            </h2>
            <p className="text-sm text-gray-600">
              Choisissez le type de votre inscription
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fonctionnalité
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                className="w-full h-10 px-4 border border-gray-300 rounded-md text-left text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent flex items-center justify-between shadow-sm"
              >
                <span
                  className={selectedRole ? "text-gray-900" : "text-gray-400"}
                >
                  {selectedRoleLabel}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 10l5 5 5-5"
                  />
                </svg>
              </button>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <div role="listbox" className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleSelect(role.value)}
                      role="option"
                      aria-selected={selectedRole === role.value}
                      className="w-full h-10 px-4 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center border-b border-gray-100 last:border-b-0"
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
            <Link
              to="/login"
              className="flex items-center text-sm font-medium text-[#2E7D32] hover:text-[#276A2B] transition-colors"
            >
              <svg
                width="18"
                height="16"
                viewBox="0 0 23 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
              >
                <path
                  d="M1.11016 10.8839C0.622007 10.3957 0.622007 9.60427 1.11016 9.11612L9.06511 1.16117C9.55327 0.67301 10.3447 0.67301 10.8329 1.16117C11.321 1.64932 11.321 2.44078 10.8329 2.92893L3.76181 10L10.8329 17.0711C11.321 17.5592 11.321 18.3507 10.8329 18.8388C10.3447 19.327 9.55327 19.327 9.06511 18.8388L1.11016 10.8839ZM22.5684 10V11.25H1.99405V10V8.75H22.5684V10Z"
                  fill="#2E7D32"
                />
              </svg>
              Retour
            </Link>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedRole}
              className="px-8 py-3 bg-[#2E7D32] text-white text-base font-medium rounded-lg hover:bg-[#276A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              Continuer
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Déjà membre ?{" "}
              <Link
                to="/login"
                className="text-[#2E7D32] hover:text-[#276A2B] transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
