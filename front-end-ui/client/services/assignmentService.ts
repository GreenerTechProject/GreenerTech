import axios from "axios";
import { tokenManager } from "./authService";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  id_assigned?: number;
  id_entreprise?: number;
}

export interface Serre {
  id: number;
  nom: string;
  id_domaine: number;
  domaine_nom?: string;
}

export interface Assignment {
  id_user: number;
  id_serre: number;
  user_name: string;
  serre_nom: string;
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

export const assignmentService = {
  // Get all users from the director's company
  getCompanyUsers: async (companyId: number): Promise<User[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/technicien/alltypes/company/${companyId}`,
        createAuthenticatedRequest(),
      );
      return response.data.technicians || [];
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la récupération des utilisateurs";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get all serres from the director's company
  getCompanySerres: async (companyId: number): Promise<Serre[]> => {
    try {
      // First get all domains for the company
      const domainsResponse = await axios.get(
        `${API_BASE_URL}/domaine`,
        createAuthenticatedRequest(),
      );
      
      const domains = domainsResponse.data || [];
      const allSerres: Serre[] = [];
      
      // Then get serres for each domain
      for (const domain of domains) {
        if (domain.id_entreprise === companyId) {
          try {
            const serresResponse = await axios.get(
              `${API_BASE_URL}/domaine/${domain.id}/serres`,
              createAuthenticatedRequest(),
            );
            const serres = serresResponse.data || [];
            const serresWithDomain = serres.map((serre: any) => ({
              ...serre,
              domaine_nom: domain.nom
            }));
            allSerres.push(...serresWithDomain);
          } catch (error) {
            console.warn(`Failed to fetch serres for domain ${domain.id}:`, error);
          }
        }
      }
      
      return allSerres;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la récupération des serres";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get all serre assignments from the director's company
  getCompanyAssignments: async (): Promise<Assignment[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/company`,
        createAuthenticatedRequest(),
      );
      
      // The backend returns a complex object, we need to extract the assignments array
      const data = response.data;
      console.log('Backend response for assignments:', data);
      
      if (data && data.assignments && Array.isArray(data.assignments)) {
        // Transform the backend format to match our Assignment interface
        return data.assignments.map((assignment: any) => ({
          id_user: assignment.user_id,
          id_serre: assignment.serre_id,
          user_name: assignment.user_name,
          serre_nom: assignment.serre_name
        }));
      }
      
      console.warn('No assignments found in response or invalid format:', data);
      return [];
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la récupération des assignments";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Assign a technician to a supervisor
  assignTechnicianToSupervisor: async (
    technician_id: number,
    supervisor_id: number
  ): Promise<{ message: string; technician_id: number; supervisor_id: number }> => {
    try {
      console.log("=== ASSIGNMENT SERVICE DEBUG ===");
      console.log("Making API call to:", `${API_BASE_URL}/users/assign-supervisor`);
      console.log("Request payload:", { technician_id, supervisor_id });
      console.log("Request headers:", createAuthenticatedRequest());
      
      const response = await axios.put(
        `${API_BASE_URL}/users/assign-supervisor`,
        { technician_id, supervisor_id },
        createAuthenticatedRequest(),
      );
      
      console.log("=== ASSIGNMENT SERVICE RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      
      return response.data;
    } catch (error: any) {
      console.error("=== ASSIGNMENT SERVICE ERROR ===");
      console.error("Error in assignTechnicianToSupervisor:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage =
        error.response?.data?.message || "Erreur lors de l'assignation du technicien";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Assign a user to a serre
  assignUserToSerre: async (
    user_id: number,
    serre_id: number
  ): Promise<{ message: string; user_id: number; serre_id: number }> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/serres/assign-user`,
        { user_id, serre_id },
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de l'assignation de l'utilisateur à la serre";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Remove a user from a serre
  removeUserFromSerre: async (
    user_id: number,
    serre_id: number
  ): Promise<{ message: string; user_id: number; serre_id: number }> => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/serres/remove-user`,
        {
          ...createAuthenticatedRequest(),
          data: { user_id, serre_id }
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la suppression de l'assignment";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Remove a technician from a supervisor
  removeTechnicianFromSupervisor: async (
    technician_id: number
  ): Promise<{ message: string; technician_id: number }> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/remove-assignment`,
        { technician_id },
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la suppression de l'assignation superviseur";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};

export default assignmentService;
