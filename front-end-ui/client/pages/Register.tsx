import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

export default function Register() {
  const location = useLocation();
  const selectedRole = location.state?.role;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    lastName: "",
    firstName: "",
    role: selectedRole || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const { unifiedRegister, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  const { isLoading: authLoading } = useAuthRedirect();

  // If no role selected, redirect to role selection
  useEffect(() => {
  if (!selectedRole) {
    navigate("/role-selection", { replace: true });
  }
  }, [selectedRole, navigate]);
  if (!selectedRole) {
    return null; // prevent render until redirect happens
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greener-600"></div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (localError) setLocalError("");
    if (authError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validation
    if (!formData.email.trim()) {
      setLocalError("L'email est requis");
      return;
    }

    if (!formData.password.trim()) {
      setLocalError("Le mot de passe est requis");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (!formData.lastName.trim()) {
      setLocalError("Le nom est requis");
      return;
    }

    if (!formData.firstName.trim()) {
      setLocalError("Le prénom est requis");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await unifiedRegister({
        email: formData.email,
        password: formData.password,
        lastName: formData.lastName,
        firstName: formData.firstName,
        role: formData.role,
      });

      // For Directeur registration, redirect to email verification page
      if (result.type === "registration") {
        navigate("/email-verification", {
          state: { email: formData.email },
        });
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

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

      {/* Registration Form Section */}
      <div className="w-full lg:w-[845px] bg-white/95 backdrop-blur lg:rounded-l-[28px] shadow-xl flex flex-col items-center justify-center px-6 sm:px-8 py-10 lg:py-12 min-h-screen">
        {/* Greener Tech Logo */}
        <div className="mb-6 lg:mb-8">
          <img
            src="/GreenerTech-Logo.jpg"
            alt="Greener Tech Logo"
            className="w-[220px] sm:w-[260px] lg:w-[320px] h-auto mx-auto"
          />
        </div>
        <p className="text-center text-gray-600 mb-8">
          Rejoignez la révolution verte avec GreenerTech 🌱
        </p>

        {/* Registration Form */}
        <div className="w-full max-w-[640px]">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Informations de directeur
          </h2>

          <p className="text-sm text-gray-600 text-center mb-6">
            Remplissez le formulaire ci-dessous pour créer votre entreprise
          </p>

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Row: Email and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email d'inscription
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 3.5C1.725 3.5 1.5 3.725 1.5 4V4.69063L6.89062 9.11563C7.5375 9.64688 8.46562 9.64688 9.1125 9.11563L14.5 4.69063V4C14.5 3.725 14.275 3.5 14 3.5H2ZM1.5 6.63125V12C1.5 12.275 1.725 12.5 2 12.5H14C14.275 12.5 14.5 12.275 14.5 12V6.63125L10.0625 10.275C8.8625 11.2594 7.13438 11.2594 5.9375 10.275L1.5 6.63125ZM0 4C0 2.89688 0.896875 2 2 2H14C15.1031 2 16 2.89688 16 4V12C16 13.1031 15.1031 14 14 14H2C0.896875 14 0 13.1031 0 12V4Z"
                        fill="#6B7280"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre.email@exemple.com"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greener-600 focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greener-600 focus:border-transparent shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Second Row: Nom and Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 3.5C1.725 3.5 1.5 3.725 1.5 4V4.69063L6.89062 9.11563C7.5375 9.64688 8.46562 9.64688 9.1125 9.11563L14.5 4.69063V4C14.5 3.725 14.275 3.5 14 3.5H2ZM1.5 6.63125V12C1.5 12.275 1.725 12.5 2 12.5H14C14.275 12.5 14.5 12.275 14.5 12V6.63125L10.0625 10.275C8.8625 11.2594 7.13438 11.2594 5.9375 10.275L1.5 6.63125ZM0 4C0 2.89688 0.896875 2 2 2H14C15.1031 2 16 2.89688 16 4V12C16 13.1031 15.1031 14 14 14H2C0.896875 14 0 13.1031 0 12V4Z"
                        fill="#6B7280"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Bennani"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greener-600 focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 3.5C1.725 3.5 1.5 3.725 1.5 4V4.69063L6.89062 9.11563C7.5375 9.64688 8.46562 9.64688 9.1125 9.11563L14.5 4.69063V4C14.5 3.725 14.275 3.5 14 3.5H2ZM1.5 6.63125V12C1.5 12.275 1.725 12.5 2 12.5H14C14.275 12.5 14.5 12.275 14.5 12V6.63125L10.0625 10.275C8.8625 11.2594 7.13438 11.2594 5.9375 10.275L1.5 6.63125ZM0 4C0 2.89688 0.896875 2 2 2H14C15.1031 2 16 2.89688 16 4V12C16 13.1031 15.1031 14 14 14H2C0.896875 14 0 13.1031 0 12V4Z"
                        fill="#6B7280"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Rachid"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greener-600 focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              {/* Back Button */}
              <Link
                to="/role-selection"
                className="flex items-center text-sm font-medium text-greener-600 hover:text-greener-700 transition-colors"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full max-w-[384px] h-12 bg-greener-600 text-white text-base font-medium rounded-lg hover:bg-greener-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow px-8"
              >
                {isSubmitting ? "Inscription..." : "S'inscrire"}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Déjà membre ?{" "}
              <Link
                to="/login"
                className="text-greener-600 hover:text-greener-700 transition-colors"
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
