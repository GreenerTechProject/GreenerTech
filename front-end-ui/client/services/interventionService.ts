import axios from "axios";

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

export interface Intervention {
  id: number;
  description: string;
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
  created_at: string;
  updated_at: string;
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
      const response = await axios.get(`${API_BASE_URL}/intervention`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching interventions:", error);
      throw error;
    }
  }

  static async getInterventionsByAssignedSerres(): Promise<Intervention[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/assigned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching interventions by assigned serres:", error);
      throw error;
    }
  }

  static async getIntervention(id: number): Promise<Intervention> {
    try {
      const response = await axios.get(`${API_BASE_URL}/intervention/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching intervention:", error);
      throw error;
    }
  }

  static async createIntervention(intervention: CreateInterventionRequest): Promise<Intervention> {
    try {
      const response = await axios.post(`${API_BASE_URL}/intervention`, intervention, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error creating intervention:", error);
      throw error;
    }
  }

  static async validateIntervention(id: number): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/intervention/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error("Error validating intervention:", error);
      throw error;
    }
  }

  static async deleteIntervention(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/intervention/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error("Error deleting intervention:", error);
      throw error;
    }
  }
}


