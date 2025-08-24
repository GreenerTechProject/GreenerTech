import axios from "axios";
import { tokenManager } from "./authService";

export interface Domain {
  id: number;
  nom: string;
  surface?: number;
  center?: { lat: number; lng: number };
  id_entreprise: number;
}

export interface CreateDomainRequest {
  nom: string;
  surface: number;
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

export interface UpdateDomainRequest {
  name?: string;
  area?: number;
  center?: { lat: number; lng: number };
  path?: { lat: number; lng: number; ordre: number }[];
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
  

  deleteDomain: async (id: string | number): Promise<{ message: string }> => {
    try {
      const response = await axios.delete<{ message: string }>(
        `${API_BASE_URL}/domaine/${id}`,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la suppression du domaine";
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
        const response = await axios.post<CreateDomainResponse>(
          `${API_BASE_URL}/domaine`,
          domain,
          createAuthenticatedRequest(),
        );
        results.push(response.data);
      }

      return results;
    } catch (error: any) {
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
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des domaines";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  updateDomain: async (id: string | number, updates: UpdateDomainRequest): Promise<{ message: string }> => {
    try {
      const response = await axios.put<{ message: string }>(
        `${API_BASE_URL}/domaine/${id}`,
        updates,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la mise à jour du domaine";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};

export default domainService;
