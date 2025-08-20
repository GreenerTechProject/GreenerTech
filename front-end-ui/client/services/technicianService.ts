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
  getTechniciansByCompany: async (companyId: number): Promise<Technician[]> => {
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

  getAllTechniciansByCompany: async (companyId: number): Promise<Technician[]> => {
    try {
      console.log('[TechService] Fetching technicians for company:', companyId);
      console.log('[TechService] API URL:', `${API_BASE_URL}/technicien/alltypes/company/${companyId}`);
      
      const response = await axios.get<{
        success: boolean;
        technicians: Technician[];
      }>(`${API_BASE_URL}/technicien/alltypes/company/${companyId}`,
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

  // Update technician
  updateTechnician: async (
    technicianId: number,
    updates: UpdateTechnicianRequest
  ): Promise<UpdateTechnicianResponse> => {
    try {
      console.log("Updating technician:", technicianId, "with updates:", updates);
      
      const response = await axios.put<any>(
        `${API_BASE_URL}/technicien/${technicianId}`,
        updates,
        createAuthenticatedRequest(),
      );
      
      console.log("Technician update response:", response.data);
      
      return {
        message: response.data?.message ?? "Technicien mis à jour avec succès",
        user: response.data?.user ?? null,
      };
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du technicien:", error);

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
      console.log("Deleting technician:", technicianId);
      
      const response = await axios.delete<any>(
        `${API_BASE_URL}/technicien/${technicianId}`,
        createAuthenticatedRequest(),
      );
      
      console.log("Technician deletion response:", response.data);
      
      return {
        message: response.data?.message ?? "Technicien supprimé avec succès",
        deleted_user: response.data?.deleted_user ?? null,
      };
    } catch (error: any) {
      console.error("Erreur lors de la suppression du technicien:", error);

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
      console.log("Fetching interventions for technician:", technicianId);
      
      const response = await axios.get<{
        success: boolean;
        interventions: Intervention[];
      }>(`${API_BASE_URL}/technicien/${technicianId}/interventions`,
        createAuthenticatedRequest(),
      );
      
      console.log("Interventions response:", response.data);
      
      if (response.data?.success && response.data?.interventions) {
        return response.data.interventions;
      }
      
      return [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des interventions:", error);
      return [];
    }
  },
};

export default technicianService;

