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
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  
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
      throw error;
    }
  }

  static async getInterventionsByAssignedSerres(): Promise<Intervention[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/assigned`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getIntervention(id: number): Promise<Intervention> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createIntervention(intervention: CreateInterventionRequest): Promise<Intervention> {
    try {
      const response = await axios.post(`${API_BASE_URL}/intervention`, intervention, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async validateIntervention(id: number): Promise<void> {
    try {
      const requestConfig = createAuthenticatedRequest();

      await axios.put(`${API_BASE_URL}/intervention/${id}/validate`, {}, requestConfig);
    } catch (error: any) {
      console.error("Error in validateIntervention:", error);
      console.error("Error response:", error.response);
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
      const requestConfig = createAuthenticatedRequest();

      await axios.put(`${API_BASE_URL}/intervention/${id}/reject`, { reason }, requestConfig);
    } catch (error: any) {
      console.error("Error in rejectIntervention:", error);
      console.error("Error response:", error.response);
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
      throw error;
    }
  }

  static async deleteIntervention(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/intervention/${id}`, createAuthenticatedRequest());
    } catch (error) {
      throw error;
    }
  }
}

