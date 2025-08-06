import axios from "axios";
import { tokenManager } from "./authService";

export interface Serre {
  id: string;
  name: string;
  area: number;
  domainId: string;
  guideId: string;
  path: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  guide?: {
    id: string;
    variety: string;
    yield: number;
    plantingDate: string;
    harvestDate: string;
    irrigationType?: string;
    notes?: string;
  };
}

export interface CreateSerreRequest {
  name: string;
  area: number;
  domainId: string;
  guideId: string;
  path: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
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
  // Create multiple serres
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
  getSerresByDomain: async (domainId: string): Promise<Serre[]> => {
    try {
      const response = await axios.get<{ success: boolean; serres: Serre[] }>(
        `${API_BASE_URL}/serres/domain/${domainId}`,
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
