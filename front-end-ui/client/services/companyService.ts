import axios from "axios";
import { tokenManager } from "./authService";

export interface Company {
  id: string;
  name: string;
  type: string;
  location: string;
  isActive: boolean;
}

export interface CompanyInfo {
  nom : string;
  adresse: string;
  cie: string;
  status_juridique : string;
  email : string;
}

export interface CompaniesResponse {
  success: boolean;
  companies: Company[];
}

export interface ApiError {
  message: string;
  status: number;
}

export interface CreateCompanyResponse {
  success?: boolean;
  message?: string;
  companyId?: string;
  id?: string;
}

// Configure axios base URL - should match your backend
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Create axios instance with auth headers
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const companyService = {
  // Get all companies
  getCompanies: async (): Promise<Company[]> => {
    try {
      const response = await axios.get<CompaniesResponse>(
        `${API_BASE_URL}/entreprises`,
        createAuthenticatedRequest(),
      );

      if (response.data.success) {
        return response.data.companies;
      } else {
        throw new Error("Échec de la récupération des entreprises");
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des entreprises:", error);

      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === 404
          ? "Endpoint des entreprises non trouvé"
          : "Erreur lors de la récupération des entreprises");

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create a new company
  createCompany: async (
    companyData: CompanyInfo,
  ): Promise<CreateCompanyResponse> => {
    try {
      console.log("Sending company data:", companyData);
      const response = await axios.post<CreateCompanyResponse>(
        `${API_BASE_URL}/entreprise`,
        companyData,
        createAuthenticatedRequest(),
      );

      console.log("Company creation response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'entreprise:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de l'entreprise";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default companyService;
