import axios from "axios";
import { tokenManager } from "./authService";

export interface GuideDeCulture {
  id: string;
  variety: string;
  yield: number;
  plantingDate: string;
  harvestDate: string;
  irrigationType?: string;
  notes?: string;
}

export interface CreateGuideRequest {
  variety: string;
  yield: number;
  plantingDate: string;
  harvestDate: string;
  irrigationType?: string;
  notes?: string;
}

export interface CreateGuideResponse {
  success: boolean;
  message: string;
  guideId: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Configure axios base URL
const API_BASE_URL = "/api";

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
        `${API_BASE_URL}/guides-culture`,
        guide,
        createAuthenticatedRequest(),
      );
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
      const response = await axios.get<{
        success: boolean;
        guides: GuideDeCulture[];
      }>(`${API_BASE_URL}/guides-culture`, createAuthenticatedRequest());

      if (response.data.success) {
        return response.data.guides;
      } else {
        throw new Error("Échec de la récupération des guides");
      }
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
