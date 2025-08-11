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

  // Get serres assigned to a given user (by autorisations)
  getSerresAssignedToUser: async (userId: number): Promise<any[]> => {
    try {
      // Fetch autorisations for this user
      const authzResp = await axios.get(
        `${API_BASE_URL}/autorisation_serre`,
        {
          ...createAuthenticatedRequest(),
          params: { id_user: userId },
        },
      );

      const autorisations = authzResp.data?.data || [];
      const serreIds: number[] = autorisations.map((a: any) => a.id_serre);
      if (serreIds.length === 0) return [];

      // Fetch details for each serre (position needed to draw polygon)
      const results: any[] = [];
      for (const id of serreIds) {
        try {
          const r = await axios.get(`${API_BASE_URL}/serre/${id}`, createAuthenticatedRequest());
          results.push(r.data);
        } catch (_) {}
      }
      return results;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres assignées";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get serres assigned to the current user
  getSerresByUser: async (): Promise<any[]> => {
    try {
      // Get current user's ID from localStorage or context
      const token = tokenManager.getToken();
      if (!token) {
        throw new Error("Token non trouvé");
      }

      // Decode token to get user ID (you might need to adjust this based on your token structure)
      // For now, we'll use a different approach - get user info from the backend
      const userResponse = await axios.get(`${API_BASE_URL}/user`, createAuthenticatedRequest());
      const userId = userResponse.data.id;

      // Use the existing method to get assigned serres
      return await serreService.getSerresAssignedToUser(userId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres de l'utilisateur";
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
  
  // Get bilans by serre
  getBilansBySerre: async (serreId: number): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/${serreId}/bilans`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des bilans";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get guides by serre to extract 'variete'
  getGuidesBySerre: async (serreId: number): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/${serreId}/guides`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des guides";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get autorisations for serres filtered by user or serre
  getAutorisationSerre: async (
    params: { id_user?: number; id_serre?: number }
  ): Promise<AutorisationSerre[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/autorisation_serre`,
        {
          ...createAuthenticatedRequest(),
          params,
        }
      );
      const list = (response.data?.data ?? []) as AutorisationSerre[];
      return list;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des autorisations serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get serres assigned to the current user using the new backend endpoint
  getSerresByCurrentUser: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/user`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des serres de l'utilisateur";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default serreService;
