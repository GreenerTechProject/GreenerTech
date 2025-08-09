import axios from "axios";
import { tokenManager } from "./authService";
import { ExtendedSerre } from "@shared/api";

export interface CreateSerreRequest {
  nom: string;
  id_domaine: number;
  position?: {
    latitude: number;
    longitude: number;
    ordre: number;
  }[];
  surface?: number;
  center?: {
    lat: number;
    lng: number;
  };
}

export interface CreateSerreResponse {
  id?: number;
  serreId?: string;
  nom: string;
  id_domaine: number;
  position?: {
    id: number;
    lat: number;
    lng: number;
    ordre: number;
  }[];
}

export interface ApiError {
  message: string;
  status: number;
}

export interface AutorisationSerre {
  id: number;
  id_user: number;
  id_serre: number;
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
      console.log("Creating serre:", serre);
      const response = await axios.post<CreateSerreResponse>(
        `${API_BASE_URL}/serre`,
        serre,
        createAuthenticatedRequest(),
      );
      console.log("Serre creation response:", response.data);
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

  // Add this to your serreService.ts
getAllSerres: async (): Promise<ExtendedSerre[]> => {
    try {
        const response = await axios.get<ExtendedSerre[]>(
            `${API_BASE_URL}/serre`,
            createAuthenticatedRequest()
        );
        
        return response.data;
    } catch (error: any) {
        console.error("Error fetching all serres:", error);

        const errorMessage = error.response?.data?.message || 
            "Failed to fetch serres";
        
        throw {
            message: errorMessage,
            status: error.response?.status || 500
        } as ApiError;
    }
},
  
  // Create an autorisation for a user to access a serre
  createAutorisationSerre: async (
    payload: { id_user: number; id_serre: number }
  ): Promise<AutorisationSerre> => {
    try {
      const response = await axios.post<AutorisationSerre>(
        `${API_BASE_URL}/autorisation_serre`,
        payload,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création d'autorisation serre:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création d'autorisation serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default serreService;
