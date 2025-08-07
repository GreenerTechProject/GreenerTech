import axios from "axios";
import { tokenManager } from "./authService";
import { ExtendedSerre } from "@shared/api";

export interface CreateSerreRequest {
  nom: string;
  id_domaine: number;
  position: {
    latitude: number;
    longitude: number;
    ordre: number;
  }[];
}

export interface CreateSerreResponse {
  success: boolean;
  message: string;
  serreId: string;
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

export const serreService = {
  // Create a single serre
  createSerre: async (serre: CreateSerreRequest): Promise<CreateSerreResponse> => {
    try {
      const response = await axios.post<CreateSerreResponse>(
        `${API_BASE_URL}/serre`,
        serre,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création de la serre:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de la serre";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create multiple serres (optional - keep if you need bulk creation)
  createSerres: async (
    serres: CreateSerreRequest[],
  ): Promise<CreateSerreResponse[]> => {
    try {
      const results: CreateSerreResponse[] = [];

      for (const serre of serres) {
        const response = await axios.post<CreateSerreResponse>(
          `${API_BASE_URL}/serre`,
          serre,
          createAuthenticatedRequest(),
        );
        results.push(response.data);
      }

      return results;
    } catch (error: any) {
      console.error("Erreur lors de la création des serres:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des serres";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },


  // Get serres by domain ID
  getSerresByDomain: async (domainId: string): Promise<ExtendedSerre[]> => {
    try {
      const response = await axios.get<{ success: boolean; serres: ExtendedSerre[] }>(
        `${API_BASE_URL}/domaine/${domainId}/serres`,
        createAuthenticatedRequest(),
      );

      if (response.data.success) {
        return response.data.serres;
      } else {
        throw new Error("Échec de la récupération des serres");
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des serres:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des serres";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default serreService;
