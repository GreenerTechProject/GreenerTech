import axios from "axios";
import { tokenManager } from "./authService";

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Create axios request config with Authorization header (aligned with domainService)
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
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
      await axios.put(`${API_BASE_URL}/intervention/${id}/validate`, {}, createAuthenticatedRequest());
    } catch (error) {
      console.error("Error validating intervention:", error);
      throw error;
    }
  }

  static async rejectIntervention(id: number, reason?: string): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/intervention/${id}/reject`, { reason }, createAuthenticatedRequest());
    } catch (error) {
      console.error("Error rejecting intervention:", error);
      throw error;
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

