import axios from "axios";
import { tokenManager } from "./authService";

export interface Technician {
  id: string;
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
  success: boolean;
  message: string;
  technicianId: string;
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
        const response = await axios.post<CreateTechnicianResponse>(
          `${API_BASE_URL}/technicien`,
          {
            email: technician.email,
            fullName: technician.fullName,
            role: technician.role,
            // The backend will automatically associate with the current user's company
          },
          createAuthenticatedRequest(),
        );
        console.log("Technician creation response:", response.data);
        results.push(response.data);
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
      const response = await axios.get<{
        success: boolean;
        technicians: Technician[];
      }>(
        `${API_BASE_URL}/technicien/company/${companyId}`,
        createAuthenticatedRequest(),
      );

      if (response.data.success) {
        return response.data.technicians;
      } else {
        throw new Error("Échec de la récupération des techniciens");
      }
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
