import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import { useAuth } from "../contexts/AuthContext";
import { companyService, Company } from "../services/companyService";

const roles = [
  { value: "technicien-superieur", label: "Technicien Supérieur" },
  { value: "technicien", label: "Technicien" },
];

export default function AffiliationRequest() {
  const location = useLocation();
  const selectedRole = location.state?.role;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    telephone: "",
    cin: "",
    companyName: "",
    birthDate: "",
    role: selectedRole || "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  // Redirect if already authenticated
  const { isLoading: authLoading } = useAuthRedirect();
  const { unifiedRegister, error: authError, clearError } = useAuth();

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const companiesData = await companyService.getCompanies();
        setCompanies(companiesData);
      } catch (error: any) {
        console.error("Error fetching companies:", error);
        const errorMessage =
          error.message || "Erreur lors du chargement des entreprises";
        setLocalError(errorMessage);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="role"]')) {
        setIsDropdownOpen(false);
      }
      if (!target.closest('[data-dropdown="company"]')) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If no role selected or wrong role, redirect to role selection
  if (
    !selectedRole ||
    (selectedRole !== "technicien-superieur" && selectedRole !== "technicien")
  ) {
    navigate("/role-selection", { replace: true });
    return null;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (localError) setLocalError("");
    if (authError) clearError();
  };

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
    setIsDropdownOpen(false);
  };

  const handleCompanySelect = (companyName: string) => {
    setFormData((prev) => ({ ...prev, companyName }));
    setIsCompanyDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.telephone ||
      !formData.cin ||
      !formData.companyName ||
      !formData.birthDate
    ) {
      setLocalError("Tous les champs sont requis");
      setIsSubmitting(false);
      return;
    }

    // Telephone validation
    if (formData.telephone.length < 8) {
      setLocalError("Le numéro de téléphone doit contenir au moins 8 chiffres");
      setIsSubmitting(false);
      return;
    }

    // CIN validation
    if (formData.cin.length < 8) {
      setLocalError("Le CIN doit contenir au moins 8 caractères");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await unifiedRegister({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        telephone: formData.telephone,
        cin: formData.cin,
        companyName: formData.companyName,
        birthDate: formData.birthDate,
        role: formData.role,
      });

      // For affiliation requests, show success message and redirect to login
      if (result.type === "affiliation") {
        alert(
          `Demande d'affiliation soumise avec succès! ID de demande: ${result.data.requestId}`,
        );
        navigate("/login");
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleLabel =
    roles.find((role) => role.value === formData.role)?.label || "chevron-down";

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#D6E2CC] to-[#D6E2CC] flex flex-col lg:flex-row">
      {/* Background Image Section */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-screen">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fe15cdeeaccbb4f9394b3b7b30742eb8c%2F97c345a448194346ad4e8ebc4b57f88f?format=webp&width=800"
          alt="Farmer using tablet in field"
          className="absolute top-0 bottom-0 right-0 left-[1px] w-[504px] h-full object-cover"
        />
      </div>

      {/* Affiliation Request Form Section */}
      <div className="w-full lg:w-[768px] bg-[#FCFEFF] lg:rounded-l-[25px] flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-8 lg:pl-20 lg:-ml-1">
        {/* Greener Tech Logo */}
        <div className="mb-8 lg:mb-12 mt-4">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b0dd8ca02c2a41b50f73559714fd5efaaf50e9cf?width=760"
            alt="Greener Tech Logo"
            className="w-[280px] sm:w-[320px] lg:w-[317px] h-auto"
          />
        </div>

        {/* Affiliation Request Form */}
        <div className="w-full max-w-[600px]">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Demande d'affiliation
            </h2>
            <p className="text-sm text-gray-600">
              Remplissez le formulaire ci-dessous pour soumettre votre demande
              d'affiliation
            </p>
          </div>

          {(localError || authError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {localError || authError}
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
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
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
                  className="w-full h-10 px-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Second Row: First Name and Last Name */}
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
                    placeholder="Rachid"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
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
                    placeholder="Bennani"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Third Row: Telephone and CIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3.5 1C2.67157 1 2 1.67157 2 2.5V3.25C2 8.636 6.364 13 11.75 13H12.5C13.3284 13 14 12.3284 14 11.5V9.75C14 9.33579 13.6642 9 13.25 9H11.25C10.8358 9 10.5 9.33579 10.5 9.75V10.5C10.5 10.7761 10.2761 11 10 11C8.61929 11 7.5 9.88071 7.5 8.5C7.5 7.11929 8.61929 6 10 6C10.2761 6 10.5 6.22386 10.5 6.5V7.25C10.5 7.66421 10.8358 8 11.25 8H13.25C13.6642 8 14 7.66421 14 7.25V2.5C14 1.67157 13.3284 1 12.5 1H3.5Z"
                        fill="#6B7280"
                      />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="06 12 34 56 78"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CIN
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 3C1.44772 3 1 3.44772 1 4V12C1 12.5523 1.44772 13 2 13H14C14.5523 13 15 12.5523 15 12V4C15 3.44772 14.5523 3 14 3H2ZM3 5H13V11H3V5ZM4 6V7H6V6H4ZM7 6V7H12V6H7ZM4 8V9H8V8H4ZM9 8V9H12V8H9Z"
                        fill="#6B7280"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="cin"
                    value={formData.cin}
                    onChange={handleChange}
                    placeholder="AB123456"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entreprise
              </label>
              <div className="relative" data-dropdown="company">
                <button
                  type="button"
                  onClick={() =>
                    setIsCompanyDropdownOpen(!isCompanyDropdownOpen)
                  }
                  disabled={loadingCompanies}
                  className="w-full h-10 px-4 border border-gray-300 rounded-md text-left text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    className={
                      formData.companyName ? "text-gray-900" : "text-gray-400"
                    }
                  >
                    {loadingCompanies
                      ? "Chargement..."
                      : formData.companyName || "Sélectionnez une entreprise"}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isCompanyDropdownOpen ? "rotate-180" : ""}`}
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

                {isCompanyDropdownOpen && !loadingCompanies && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {companies.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Aucune entreprise disponible
                      </div>
                    ) : (
                      companies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleCompanySelect(company.name)}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-b-0"
                        >
                          <span className="font-medium">{company.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {company.type} • {company.location}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Fourth Row: Birth Date and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
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
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fonctionnalité
                </label>
                <div className="relative" data-dropdown="role">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-10 px-4 border border-gray-300 rounded-md text-left text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#B4CC5F] focus:border-transparent flex items-center justify-between"
                  >
                    <span
                      className={
                        formData.role ? "text-gray-900" : "text-gray-400"
                      }
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

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => handleRoleSelect(role.value)}
                          className="w-full h-10 px-4 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center border-b border-gray-100 last:border-b-0"
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              {/* Back Button */}
              <Link
                to="/role-selection"
                className="flex items-center text-sm font-medium text-[#B4CC5F] hover:text-[#A3C247] transition-colors"
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
                    fill="#B4CC5F"
                  />
                </svg>
                Retour
              </Link>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-[#B4CC5F] text-white text-sm font-medium rounded-md hover:bg-[#A3C247] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M3.09375 4C3.09375 2.93913 3.51518 1.92172 4.26532 1.17157C5.01547 0.421427 6.03288 0 7.09375 0C8.15462 0 9.17203 0.421427 9.92218 1.17157C10.6723 1.92172 11.0938 2.93913 11.0938 4C11.0938 5.06087 10.6723 6.07828 9.92218 6.82843C9.17203 7.57857 8.15462 8 7.09375 8C6.03288 8 5.01547 7.57857 4.26532 6.82843C3.51518 6.07828 3.09375 5.06087 3.09375 4ZM0.09375 15.0719C0.09375 11.9937 2.5875 9.5 5.66563 9.5H8.52188C11.6 9.5 14.0938 11.9937 14.0938 15.0719C14.0938 15.5844 13.6781 16 13.1656 16H1.02188C0.509375 16 0.09375 15.5844 0.09375 15.0719ZM15.8438 9.75V7.75H13.8438C13.4281 7.75 13.0938 7.41563 13.0938 7C13.0938 6.58437 13.4281 6.25 13.8438 6.25H15.8438V4.25C15.8438 3.83437 16.1781 3.5 16.5938 3.5C17.0094 3.5 17.3438 3.83437 17.3438 4.25V6.25H19.3438C19.7594 6.25 20.0938 6.58437 20.0938 7C20.0938 7.41563 19.7594 7.75 19.3438 7.75H17.3438V9.75C17.3438 10.1656 17.0094 10.5 16.5938 10.5C16.1781 10.5 15.8438 10.1656 15.8438 9.75Z"
                    fill="#1F2937"
                  />
                </svg>
                {isSubmitting ? "Envoi..." : "Demander une affiliation"}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Déjà membre ?{" "}
              <Link
                to="/login"
                className="text-[#B4CC5F] hover:text-[#A3C247] transition-colors"
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
