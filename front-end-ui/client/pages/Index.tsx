import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  const { isLoading: authLoading } = useAuthRedirect();

  const from = location.state?.from?.pathname || "/dashboard";

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = () => {
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#D6E2CC] to-[#D6E2CC] flex flex-col lg:flex-row">
      {/* Background Image Section */}
      <div className="flex-1 relative min-h-[40vh] lg:min-h-screen">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fe15cdeeaccbb4f9394b3b7b30742eb8c%2F97c345a448194346ad4e8ebc4b57f88f?format=webp&width=800"
          alt="Farmer using tablet in field"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Login Form Section */}
      <div className="w-full lg:w-[845px] bg-[#FCFEFF] lg:rounded-l-[25px] flex flex-col items-center justify-center px-6 sm:px-8 py-8 lg:py-0">
        {/* Greener Tech Logo */}
        <div className="mb-12 lg:mb-16">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b0dd8ca02c2a41b50f73559714fd5efaaf50e9cf?width=760"
            alt="Greener Tech Logo"
            className="w-[280px] sm:w-[320px] lg:w-[380px] h-auto"
          />
        </div>

        {/* Login Form */}
        <div className="w-full max-w-[416px]">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Connexion
          </h2>

          <p className="text-sm text-gray-600 text-center mb-6">
            Se connecter avec votre compte
          </p>

          {error && (
            <div className={`mb-6 p-4 rounded-md border-l-4 ${
              error.toLowerCase().includes("votre compte n'a pas encore été validé par un directeur") ||
              error.toLowerCase().includes("directeur") ||
              error.toLowerCase().includes("validé") ||
              error.toLowerCase().includes("validation") ||
              error.toLowerCase().includes("pas encore été validé") ||
              error.toLowerCase().includes("compte") ||
              error.toLowerCase().includes("attente")
                ? "bg-amber-50 border-amber-400 text-amber-700"
                : error.toLowerCase().includes("email non vérifié") ||
                  error.toLowerCase().includes("vérifier votre email")
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-red-50 border-red-400 text-red-700"
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {error.toLowerCase().includes("votre compte n'a pas encore été validé par un directeur") ||
                   error.toLowerCase().includes("directeur") ||
                   error.toLowerCase().includes("validé") ||
                   error.toLowerCase().includes("validation") ||
                   error.toLowerCase().includes("pas encore été validé") ||
                   error.toLowerCase().includes("compte") ||
                   error.toLowerCase().includes("attente") ? (
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : error.toLowerCase().includes("email non vérifié") ||
                    error.toLowerCase().includes("vérifier votre email") ? (
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium mb-2">
                    {error.toLowerCase().includes("votre compte n'a pas encore été validé par un directeur") ||
                     error.toLowerCase().includes("directeur") ||
                     error.toLowerCase().includes("validé") ||
                     error.toLowerCase().includes("validation") ||
                     error.toLowerCase().includes("pas encore été validé") ||
                     error.toLowerCase().includes("compte") ||
                     error.toLowerCase().includes("attente")
                      ? "⏳ Compte en attente de validation par le directeur"
                      : error.toLowerCase().includes("email non vérifié") ||
                        error.toLowerCase().includes("vérifier votre email")
                        ? "📧 Email non vérifié"
                        : "❌ Erreur de connexion"}
                  </h3>
                  
                  {error.toLowerCase().includes("votre compte n'a pas encore été validé par un directeur") ||
                   error.toLowerCase().includes("directeur") ||
                   error.toLowerCase().includes("validé") ||
                   error.toLowerCase().includes("validation") ||
                   error.toLowerCase().includes("pas encore été validé") ||
                   error.toLowerCase().includes("compte") ||
                   error.toLowerCase().includes("attente") ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        {error}
                      </p>
                      <div className="bg-amber-100 p-3 rounded-md">
                        <p className="text-xs font-medium text-amber-800 mb-1">
                          💡 Que faire maintenant ?
                        </p>
                        <ul className="text-xs text-amber-700 space-y-1">
                          <li>• Contactez votre directeur d'entreprise</li>
                          <li>• Demandez-lui de valider votre compte</li>
                          <li>• Vous recevrez un email de confirmation</li>
                        </ul>
                      </div>
                    </div>
                  ) : error.toLowerCase().includes("email non vérifié") ||
                    error.toLowerCase().includes("vérifier votre email") ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        {error}
                      </p>
                      <div className="bg-blue-100 p-3 rounded-md">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          📧 Vérifiez votre email
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Vérifiez votre boîte de réception</li>
                          <li>• Regardez dans vos spams si nécessaire</li>
                          <li>• Cliquez sur le lien de vérification</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional guidance for different error types */}
          {error && (
            (error.toLowerCase().includes("votre compte n'a pas encore été validé par un directeur") ||
             error.toLowerCase().includes("directeur") ||
             error.toLowerCase().includes("validé") ||
             error.toLowerCase().includes("validation") ||
             error.toLowerCase().includes("pas encore été validé") ||
             error.toLowerCase().includes("compte") ||
             error.toLowerCase().includes("attente")) ? (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      📞 Besoin d'aide ?
                    </h4>
                    <p className="text-xs text-blue-700 mb-2">
                      Si vous ne savez pas comment contacter votre directeur ou si vous avez des questions :
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>• Vérifiez votre email pour les instructions d'inscription</p>
                      <p>• Contactez le support technique de votre entreprise</p>
                      <p>• Vérifiez la documentation de votre entreprise</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (error.toLowerCase().includes("email non vérifié") ||
                 error.toLowerCase().includes("vérifier votre email")) ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      🔗 Liens utiles
                    </h4>
                    <p className="text-xs text-green-700 mb-2">
                      Besoin d'aide pour vérifier votre email ?
                    </p>
                    <div className="text-xs text-green-600 space-y-1">
                      <p>• Vérifiez votre boîte de réception</p>
                      <p>• Regardez dans vos spams</p>
                      <p>• Contactez le support si le problème persiste</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 3.5C1.725 3.5 1.5 3.725 1.5 4V4.69063L6.89062 9.11563C7.5375 9.64688 8.46562 9.64688 9.1125 9.11563L14.5 4.69063V4C14.5 3.725 14.275 3.5 14 3.5H2ZM1.5 6.63125V12C1.5 12.275 1.725 12.5 2 12.5H14C14.275 12.5 14.5 12.275 14.5 12V6.63125L10.0625 10.275C8.8625 11.2594 7.13438 11.2594 5.9375 10.275L1.5 6.63125ZM0 4C0 2.89688 0.896875 2 2 2H14C15.1031 2 16 2.89688 16 4V12C16 13.1031 15.1031 14 14 14H2C0.896875 14 0 13.1031 0 12V4Z"
                      fill="#6B7280"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleInputChange();
                  }}
                  placeholder="votre.email@exemple.com"
                  className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V5C12 2.79086 10.2091 1 8 1C5.79086 1 4 2.79086 4 5V6H3C2.44772 6 2 6.44772 2 7V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V7C14 6.44772 13.5523 6 13 6H12ZM5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V6H5V5Z"
                      fill="#6B7280"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleInputChange();
                  }}
                  placeholder="••••••••••••••"
                  className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-[#B4CC5F] text-white text-sm font-medium rounded-md hover:bg-[#A3C247] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="flex items-center justify-center mt-6 gap-2">
            <Link
              to="/role-selection"
              className="text-sm font-medium text-[#B4CC5F] hover:text-[#A3C247] transition-colors"
            >
              S'inscrire
            </Link>
            <svg
              width="23"
              height="20"
              viewBox="0 0 23 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <path
                d="M21.821 10.9914C22.3091 10.5032 22.3091 9.71175 21.821 9.2236L13.866 1.26865C13.3779 0.780493 12.5864 0.780493 12.0983 1.26865C11.6101 1.7568 11.6101 2.54826 12.0983 3.03642L19.1693 10.1075L12.0983 17.1786C11.6101 17.6667 11.6101 18.4582 12.0983 18.9463C12.5864 19.4345 13.3779 19.4345 13.866 18.9463L21.821 10.9914ZM0.362793 10.1075V11.3575H20.9371V10.1075V8.85748H0.362793V10.1075Z"
                fill="#B4CC5F"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
