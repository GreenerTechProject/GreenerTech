import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";




// Step 1: Email check schema
const emailCheckSchema = z.object({
  email: z.string().email("Email invalide"),
});

// Step 2: Registration completion schema
const registrationSchema = z
  .object({
    telephone: z
      .string()
      .min(8, "Le téléphone doit contenir au moins 8 chiffres"),
    cin: z.string().min(8, "Le CIN doit contenir au moins 8 caractères"),
    birthday: z.string().min(1, "Date de naissance requise"),
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(6, "Confirmation requise"),
    // For non-pre-registered users
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(["technicien", "technicien_superieur"]).optional(),
    companyId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type EmailCheckForm = z.infer<typeof emailCheckSchema>;
type RegistrationForm = z.infer<typeof registrationSchema>;

interface PreRegisteredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company_name?: string;
  id_assigned?: string;
}

interface Company {
  id: string;
  nom: string;
}

export default function TechnicienRegistration() {
  const location = useLocation();
  const selectedRole = location.state?.role; // Get role from navigation state
  const [step, setStep] = useState<1 | 2>(1);
  const [userEmail, setUserEmail] = useState("");
  const [preRegisteredUser, setPreRegisteredUser] =
    useState<PreRegisteredUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Convert role selection value to proper role name
  const getRoleName = (roleValue: string): string => {
    if (roleValue === "technicien-superieur") return "technicien_superieur";
    if (roleValue === "technicien") return "technicien";
    return roleValue;
  };

  // Get the final role to use (either from pre-registered user or from selection)
  const getFinalRole = (): string => {
    if (preRegisteredUser) {
      return preRegisteredUser.role;
    }
    return selectedRole ? getRoleName(selectedRole) : "";
  };

  // Fetch companies for dropdown
 const fetchCompanies = async () => {
  try {
    const response = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/api/entreprises`)
    setCompanies(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Error fetching companies:", error);
    setCompanies([]);
  }
};


  // Step 1: Check email
  const onEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
      setLocalError("Email invalide");
      return;
    }

    setLocalError("");
    setIsLoading(true);
    try {
      // Send GET request with email as a query param
      const response = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/api/technicien`, {
        params: { email }
      });

      const result = response.data;
      setUserEmail(email);

      // If the backend returns user data, treat it as pre-registered
      setPreRegisteredUser({
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        company_name: result.company_name, 
        id_assigned: result.id_assigned    

      });

      toast({
        title: "Utilisateur trouvé",
        description: "Vous avez été pré-enregistré. Complétez votre inscription.",
      });

      setStep(2);
    } catch (error: any) {
      // Handle known error messages returned by Flask
      const message =
        error.response?.data?.error;
      setLocalError(message);

              if (message === "Utilisateur non trouvé") {
          setPreRegisteredUser(null);
          setUserEmail(email);
          await fetchCompanies(); // Load company list for new users

          toast({
            title: "Nouvel utilisateur",
            description: "Veuillez compléter votre inscription.",
          });

          setStep(2);
        }
    } finally {
      setIsLoading(false);
    }
  };


  // Step 2: Complete registration
  const onRegistrationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      telephone: formData.get("telephone") as string,
      cin: formData.get("cin") as string,
      birthday: formData.get("birthday") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: getFinalRole(),
      companyId: formData.get("companyId") as string,
    };

    if (!data.telephone || !data.cin || !data.birthday || !data.password) {
      setLocalError("Tous les champs obligatoires sont requis");
      return;
    }

    if (data.password !== data.confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!preRegisteredUser) {
      if (!data.firstName || !data.lastName || !data.companyId) {
        setLocalError("Veuillez remplir tous les champs obligatoires");
        return;
      }

      if (!data.role) {
        setLocalError("Rôle non défini. Veuillez recommencer depuis la sélection de rôle.");
        return;
      }
    }

    setLocalError("");
    setIsLoading(true);

    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      const payload: any = {
        email: userEmail,
        telephone: data.telephone,
        cin: data.cin,
        birthday: data.birthday,
        password: data.password,
        name: preRegisteredUser ? preRegisteredUser.name : `${data.firstName} ${data.lastName}`.trim(),
        role: preRegisteredUser ? preRegisteredUser.role : data.role,
        id_entreprise: data.companyId,
      };

      if (preRegisteredUser) {
        if (preRegisteredUser.id_assigned) {
          payload.id_assigned = preRegisteredUser.id_assigned;
        }

        payload.name = preRegisteredUser.name;
      } else {
        payload.name = fullName;
      }

     const response = await axios.post(
      `${window.location.protocol}//${window.location.hostname}:5000/api/technicien/register`,
      payload
      );
      const result = response.data;

      if (result.message && !result.error) {
        toast({
          title: "Inscription réussie",
          description: result.message,
        });
        
        navigate("/email-verification");
      } else {
        setLocalError(result.error || result.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.log(error);
      setLocalError("Impossible de compléter l'inscription");
    } finally {
      setIsLoading(false);
    }
  };


  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setPreRegisteredUser(null);
      setUserEmail("");
      setLocalError("");
    } else {
      navigate("/role-selection");
    }
  };

  const clearError = () => {
    setLocalError("");
  };

  // Handle redirect logic in useEffect
  useEffect(() => {
    if (!selectedRole && !preRegisteredUser && step === 1) {
      navigate("/role-selection", { replace: true });
    }
  }, [selectedRole, preRegisteredUser, step, navigate]);

  // If we're redirecting, return null early
  if (!selectedRole && !preRegisteredUser && step === 1) {
    return null;
  }

  useEffect(() => {
    fetchCompanies(); 
  }, []);

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
            className="w-[220px] sm:w-[260px] lg:w-[320px] h-auto"
          />
        </div>
        <p className="text-center text-gray-600 mb-8">
          Rejoignez la révolution verte avec GreenerTech 🌱
        </p>

        {/* Registration Form */}
        <div className="w-full max-w-[640px]">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1
                ? "Inscription Technicien"
                : "Compléter l'inscription"}
            </h2>
            <p className="text-sm text-gray-600">
              {step === 1
                ? "Entrez votre email pour vérifier votre statut"
                : preRegisteredUser
                  ? "Finalisez votre compte pré-enregistré"
                  : "Remplissez le formulaire ci-dessous pour créer votre compte"}
            </p>
          </div>

          {localError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {localError}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={onEmailSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
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
                    placeholder="votre.email@exemple.com"
                    onChange={clearError}
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={goBack}
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
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full max-w-[384px] h-12 bg-[#2E7D32] text-white text-base font-medium rounded-lg hover:bg-[#276A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow px-8"
                >
                  {isLoading ? "Vérification..." : "Vérifier"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegistrationSubmit} className="space-y-4">
              {/* Pre-registered user info (read-only) */}
              {preRegisteredUser && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                  <h3 className="font-medium text-green-800 text-center mb-3">
                    Informations pré-enregistrées
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={preRegisteredUser.name}
                        disabled
                        className="w-full h-10 px-4 border border-gray-200 rounded-md text-sm text-gray-600 bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <input
                        type="text"
                        value={preRegisteredUser.role}
                        disabled
                        className="w-full h-10 px-4 border border-gray-200 rounded-md text-sm text-gray-600 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="text"
                      value={preRegisteredUser.email}
                      disabled
                      className="w-full h-10 px-4 border border-gray-200 rounded-md text-sm text-gray-600 bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Non-pre-registered user fields */}
              {!preRegisteredUser && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Prénom"
                        onChange={clearError}
                        className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Nom"
                        onChange={clearError}
                        className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <input
                        type="text"
                        name="role"
                        value={getFinalRole()}
                        disabled
                        className="w-full h-10 px-4 border border-gray-200 rounded-md text-sm text-gray-600 bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entreprise *
                      </label>
                      <select
                        name="companyId"
                        onChange={clearError}
                        className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Sélectionnez votre entreprise
                        </option>
                        {Array.isArray(companies) && companies.length > 0 ? (
                          companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.nom}
                            </option>
                          ))
                        ) : (
                          <option value="no-companies" disabled>
                            Aucune entreprise disponible
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Common fields for both user types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    placeholder="0612345678"
                    onChange={clearError}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CIN
                  </label>
                  <input
                    type="text"
                    name="cin"
                    placeholder="AB123456"
                    onChange={clearError}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    onChange={clearError}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    onChange={clearError}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    onChange={clearError}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8FB344] focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={goBack}
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
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full max-w-[384px] h-12 bg-[#2E7D32] text-white text-base font-medium rounded-lg hover:bg-[#276A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow px-8"
                >
                  {isLoading ? "Inscription..." : "Compléter l'inscription"}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Déjà membre ?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#2E7D32] hover:text-[#276A2B] transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}