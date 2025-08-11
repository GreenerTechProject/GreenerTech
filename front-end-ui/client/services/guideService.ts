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
      console.log("Creating guide:", guide);
      const response = await axios.post<CreateGuideResponse>(
        `${API_BASE_URL}/guide_culture`,
        guide,
        createAuthenticatedRequest(),
      );
      console.log("Guide creation response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création du guide:", error);

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
      console.error("Erreur lors de la récupération des guides:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des guides de culture";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default guideService;
