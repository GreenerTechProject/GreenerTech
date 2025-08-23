import axios from "axios";
import { tokenManager } from "./authService";

export interface Technician {
  id: number | string; // Allow string for temp IDs in setup mode
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  telephone: string | null;
  birthday: string | null;
  created_at: string | null;
  updated_at: string | null;
  id_assigned: number | string | null; // Allow string for temp IDs in setup mode
  setup_completed: boolean;
  directeur_valide: boolean;
  email_valide: boolean;
  id_entreprise: number | null;
  assignedSerres: string[];
  // Frontend computed fields
  status: 'active' | 'inactive' | 'pending';
  interventions: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export interface Intervention {
  id: number;
  description: string;
  status: 'encours' | 'terminé';
  date_debut: string | null;
  date_fin: string | null;
  total_charges: number;
  valid: boolean;
  serre_id: number;
  type_tache_id: number;
  serre_nom?: string;
  domaine_nom?: string;
  type_nom?: string;
}

export interface CreateTechnicianRequest {
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  companyId: number;
}

export interface CreateTechnicianResponse {
  message: string;
  id: number;
}

export interface UpdateTechnicianRequest {
  email?: string;
  name?: string;
  role?: "technicien_superieur" | "technicien";
  directeur_valide?: boolean;
  email_valide?: boolean;
}

export interface UpdateTechnicianResponse {
  message: string;
  user: any;
}

export interface DeleteTechnicianResponse {
  message: string;
  deleted_user: any;
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
        results.push({
          message: response.data?.message ?? "",
          id: response.data?.id ?? 0,
        });
      }

      return results;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des techniciens";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get all technicians by company ID (including both technicien and technicien_superieur)
  getAllTechniciansByCompany: async (companyId: number): Promise<Technician[]> => {
    try {
      const response = await axios.get<{
        success: boolean;
        technicians: Technician[];
      }>(`${API_BASE_URL}/technicien/alltypes/company/${companyId}`,
        createAuthenticatedRequest());
  
      if (response.data?.success && response.data?.technicians) {
        return response.data.technicians;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.technicians && Array.isArray(response.data.technicians)) {
        return response.data.technicians;
      }
      
      return [];
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des techniciens";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get only technicians (not supervisors) by company ID
  getTechniciansByCompany: async (companyId: number): Promise<Technician[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/technicien/company/${companyId}`,
        createAuthenticatedRequest()
      );
      return response.data.technicians || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de la récupération des techniciens");
    }
  },

  // Get all supervisors by company ID
  getSupervisorsByCompany: async (companyId: number): Promise<Technician[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/technicien/supervisors/company/${companyId}`,
        createAuthenticatedRequest()
      );
      return response.data.supervisors || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de la récupération des superviseurs");
    }
  },

  // Update technician
  updateTechnician: async (
    technicianId: number,
    updates: UpdateTechnicianRequest
  ): Promise<UpdateTechnicianResponse> => {
    try {
      const response = await axios.put<any>(
        `${API_BASE_URL}/technicien/${technicianId}`,
        updates,
        createAuthenticatedRequest(),
      );
      
      return {
        message: response.data?.message ?? "Technicien mis à jour avec succès",
        user: response.data?.user ?? null,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de la mise à jour du technicien";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Delete technician
  deleteTechnician: async (
    technicianId: number
  ): Promise<DeleteTechnicianResponse> => {
    try {
      const response = await axios.delete<any>(
        `${API_BASE_URL}/technicien/${technicianId}`,
        createAuthenticatedRequest(),
      );
      
      return {
        message: response.data?.message ?? "Technicien supprimé avec succès",
        deleted_user: response.data?.deleted_user ?? null,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de la suppression du technicien";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get interventions by technician ID
  getInterventionsByTechnician: async (
    technicianId: number
  ): Promise<Intervention[]> => {
    try {
      const response = await axios.get<{
        success: boolean;
        interventions: Intervention[];
      }>(`${API_BASE_URL}/technicien/${technicianId}/interventions`,
        createAuthenticatedRequest(),
      );
      
      if (response.data?.success && response.data?.interventions) {
        return response.data.interventions;
      }
      
      return [];
    } catch (error: any) {
      return [];
    }
  },
};

export default technicianService;

