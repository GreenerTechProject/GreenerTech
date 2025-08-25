import axios from "axios";
import { tokenManager } from "./authService";

export interface GuideDeCulture {
  id: string;
  nom: string;
  variete: string;
  rendement: number;
  nombre_de_plants: number;
  date_debut_saison: string;
  date_fin_saison: string;
  id_serre: string;
}

export interface CreateGuideRequest {
  nom: string;
  variete: string;
  rendement: number;
  nombre_de_plants: number;
  date_debut_saison: string;
  date_fin_saison: string;
  id_serre: string;
}

export interface CreateGuideResponse {
  message: string;
  guideId: string;
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

export const guideService = {
  // Create culture guide
  createGuide: async (
    guide: CreateGuideRequest,
  ): Promise<CreateGuideResponse> => {
    try {
      const response = await axios.post<CreateGuideResponse>(
        `${API_BASE_URL}/guide_culture`,
        guide,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création du guide de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get guides by user
  getGuides: async (): Promise<GuideDeCulture[]> => {
    try {
      const response = await axios.get<GuideDeCulture[]>(
        `${API_BASE_URL}/guide_culture`, 
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des guides de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get guides by serre ID
  getGuidesBySerre: async (serreId: number): Promise<GuideDeCulture[]> => {
    try {
      const response = await axios.get<GuideDeCulture[]>(
        `${API_BASE_URL}/serre/${serreId}/guides`, 
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des guides de culture pour cette serre";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get guide by ID
  getGuideById: async (guideId: string): Promise<GuideDeCulture> => {
    try {
      const response = await axios.get<GuideDeCulture>(
        `${API_BASE_URL}/guide_culture/${guideId}`, 
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération du guide de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update guide by ID
  updateGuide: async (guideId: string, updateData: Partial<CreateGuideRequest>): Promise<GuideDeCulture> => {
    try {
      const response = await axios.put<GuideDeCulture>(
        `${API_BASE_URL}/guide_culture/${guideId}`,
        updateData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la mise à jour du guide de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Delete guide by ID
  deleteGuide: async (guideId: string): Promise<{ message: string }> => {
    try {
      const response = await axios.delete<{ message: string }>(
        `${API_BASE_URL}/guide_culture/${guideId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la suppression du guide de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default guideService;
