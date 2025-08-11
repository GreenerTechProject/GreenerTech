import axios from "axios";
import { tokenManager } from "./authService";

export interface Domain {
  id: string;
  name: string;
  area: number;
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  companyId?: string;
}

export interface CreateDomainRequest {
  name: string;
  area: number;
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  companyId: string;
}

export interface CreateDomainResponse {
  success?: boolean;
  message?: string;
  domainId?: string;
  id?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Configure axios base URL
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

export const domainService = {
  // Get domains for current user's entreprise (role-aware backend route /domaine)
  getMyCompanyDomains: async (): Promise<Domain[]> => {
    try {
      const response = await axios.get<Domain[]>(
        `${API_BASE_URL}/domaine`,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la récupération des domaines";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
  // Create multiple domains
  createDomains: async (
    domains: CreateDomainRequest[],
  ): Promise<CreateDomainResponse[]> => {
    try {
      const results: CreateDomainResponse[] = [];

      for (const domain of domains) {
        console.log("Creating domain:", domain);
        const response = await axios.post<CreateDomainResponse>(
          `${API_BASE_URL}/domaine`,
          domain,
          createAuthenticatedRequest(),
        );
        console.log("Domain creation response:", response.data);
        results.push(response.data);
      }

      return results;
    } catch (error: any) {
      console.error("Erreur lors de la création des domaines:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des domaines";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get domains by company ID
  getDomainsByCompany: async (companyId: string): Promise<Domain[]> => {
    try {
      const response = await axios.get<{ success: boolean; domains: Domain[] }>(
        `${API_BASE_URL}/domains/company/${companyId}`,
        createAuthenticatedRequest(),
      );

      if (response.data.success) {
        return response.data.domains;
      } else {
        throw new Error("Échec de la récupération des domaines");
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des domaines:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des domaines";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default domainService;
