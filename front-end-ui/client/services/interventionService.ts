import axios from "axios";
import { tokenManager } from "./authService";

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Handle authentication errors globally
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    // Clear token and redirect to login
    tokenManager.removeToken();
    tokenManager.removeRefreshToken();
    localStorage.removeItem('user_data');
    window.location.href = '/login';
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  throw error;
};

// Create axios request config with Authorization header (aligned with domainService)
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  console.log(`DEBUG: createAuthenticatedRequest - Token available: ${token ? 'Yes' : 'No'}`); // Debug log
  if (token) {
    console.log(`DEBUG: createAuthenticatedRequest - Token starts with: ${token.substring(0, 20)}...`); // Debug log
  }
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  
  console.log(`DEBUG: createAuthenticatedRequest - Final headers:`, config.headers); // Debug log
  return config;
};

export interface Intervention {
  id: number;
  description: string;
  status: 'encours' | 'terminé' | 'en_attente' | 'rejetee';
  id_user: number;
  id_serre: number;
  id_type_tache: number;
  total_charges: number;
  date_debut: string;
  date_fin: string;
  valid: boolean;
  serre_nom?: string;
  domaine_nom?: string;
  type_nom?: string;
  type_tache?: string;
  technician_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInterventionRequest {
  description: string;
  id_serre: number;
  id_type_tache: number;
  total_charges?: number;
  date_debut?: string;
  date_fin?: string;
}

export class InterventionService {
  static async getAllInterventions(): Promise<Intervention[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error("Error fetching interventions:", error);
      throw error;
    }
  }

  static async getInterventionsByAssignedSerres(): Promise<Intervention[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/assigned`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error("Error fetching interventions by assigned serres:", error);
      throw error;
    }
  }

  static async getIntervention(id: number): Promise<Intervention> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error("Error fetching intervention:", error);
      throw error;
    }
  }

  static async createIntervention(intervention: CreateInterventionRequest): Promise<Intervention> {
    try {
      const response = await axios.post(`${API_BASE_URL}/intervention`, intervention, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error("Error creating intervention:", error);
      throw error;
    }
  }

  static async validateIntervention(id: number): Promise<void> {
    try {
      console.log(`DEBUG: Attempting to validate intervention ${id}`); // Debug log
      const token = tokenManager.getToken();
      console.log(`DEBUG: Token available: ${token ? 'Yes' : 'No'}`); // Debug log
      if (token) {
        console.log(`DEBUG: Token starts with: ${token.substring(0, 20)}...`); // Debug log
      }
      
      await axios.put(`${API_BASE_URL}/intervention/${id}/validate`, {}, createAuthenticatedRequest());
      console.log(`DEBUG: Intervention ${id} validated successfully`); // Debug log
    } catch (error: any) {
      console.error("Error validating intervention:", error);
      console.log(`DEBUG: Error response status: ${error.response?.status}`); // Debug log
      console.log(`DEBUG: Error response data:`, error.response?.data); // Debug log
      handleAuthError(error);
      if (error.response?.status === 403) {
        throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
      } else {
        throw new Error("Erreur lors de la validation de l'intervention. Veuillez réessayer.");
      }
    }
  }

  static async rejectIntervention(id: number, reason?: string): Promise<void> {
    try {
      console.log(`DEBUG: Attempting to reject intervention ${id} with reason: ${reason}`); // Debug log
      const token = tokenManager.getToken();
      console.log(`DEBUG: Token available: ${token ? 'Yes' : 'No'}`); // Debug log
      if (token) {
        console.log(`DEBUG: Token starts with: ${token.substring(0, 20)}...`); // Debug log
      }
      
      await axios.put(`${API_BASE_URL}/intervention/${id}/reject`, { reason }, createAuthenticatedRequest());
      console.log(`DEBUG: Intervention ${id} rejected successfully`); // Debug log
    } catch (error: any) {
      console.error("Error rejecting intervention:", error);
      console.log(`DEBUG: Error response status: ${error.response?.status}`); // Debug log
      console.log(`DEBUG: Error response data:`, error.response?.data); // Debug log
      handleAuthError(error);
      if (error.response?.status === 403) {
        throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
      } else {
        throw new Error("Erreur lors du rejet de l'intervention. Veuillez réessayer.");
      }
    }
  }

  static async getInterventionsByEnterprise(entrepriseId: number): Promise<Intervention[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/entreprise/${entrepriseId}`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error("Error fetching interventions by enterprise:", error);
      throw error;
    }
  }

  static async deleteIntervention(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/intervention/${id}`, createAuthenticatedRequest());
    } catch (error) {
      console.error("Error deleting intervention:", error);
      throw error;
    }
  }
}

