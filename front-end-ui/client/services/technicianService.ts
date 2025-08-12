import axios from "axios";
import { tokenManager } from "./authService";

export interface Technician {
  id: number;  // Changed from string to number to match backend response
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
}

export interface CreateTechnicianRequest {
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
  companyId: string;
}

export interface CreateTechnicianResponse {
  message: string;
  id: number;
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

export const technicianService = {
  // Create multiple technicians
  createTechnicians: async (
    technicians: CreateTechnicianRequest[],
  ): Promise<CreateTechnicianResponse[]> => {
    try {
      const results: CreateTechnicianResponse[] = [];

      for (const technician of technicians) {
        console.log("Creating technician:", technician);
        const response = await axios.post<any>(
          `${API_BASE_URL}/technicien`,
          {
            email: technician.email,
            fullName: technician.fullName,
            role: technician.role,
            companyId: technician.companyId,
          },
          createAuthenticatedRequest(),
        );
        console.log("Technician creation response:", response.data);
        // Normalize backend response { message, id }
        results.push({
          message: response.data?.message ?? "",
          id: response.data?.id ?? 0,
        });
      }

      return results;
    } catch (error: any) {
      console.error("Erreur lors de la création des techniciens:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des techniciens";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get technicians by company ID
  getTechniciansByCompany: async (companyId: string): Promise<Technician[]> => {
    try {
      console.log('[TechService] Fetching technicians for company:', companyId);
      console.log('[TechService] API URL:', `${API_BASE_URL}/technicien/company/${companyId}`);
      
      const response = await axios.get<{
        success: boolean;
        technicians: Technician[];
      }>(`${API_BASE_URL}/technicien/company/${companyId}`,
        createAuthenticatedRequest());
  
      console.log('[TechService] Response:', response.data);
      
      console.log('[TechService] Full response data:', response.data);
      
      // Handle different response formats
      if (response.data?.success && response.data?.technicians) {
        console.log('[TechService] Success response with technicians array:', response.data.technicians);
        return response.data.technicians;
      } else if (Array.isArray(response.data)) {
        console.log('[TechService] Direct array response:', response.data);
        return response.data;
      } else if (response.data?.technicians && Array.isArray(response.data.technicians)) {
        console.log('[TechService] Response with technicians array (no success field):', response.data.technicians);
        return response.data.technicians;
      }
      
      console.log('[TechService] Unexpected response format, returning empty array');
      console.log('[TechService] Response data type:', typeof response.data);
      console.log('[TechService] Response data keys:', Object.keys(response.data || {}));
      return [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des techniciens:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des techniciens";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default technicianService;
