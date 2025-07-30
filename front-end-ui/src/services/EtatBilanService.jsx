import api from './api'; 

class EtatBilanService {
  // Create a new etat bilan
  static async createEtatBilan(data) {
    try {
      const res = await api.post('/etat_bilan', data);
      return res.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get etat bilan by ID
  static async getEtatBilan(id) {
    try {
      const res = await api.get(`/etat_bilan/${id}`);
      return res.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get all etats bilan by bilan ID
  static async getEtatBilanByBilan(bilanId) {
    try {
      const res = await api.get(`/etat_bilan/bilan/${bilanId}`);
      return res.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Update an existing etat bilan
  static async updateEtatBilan(id, data) {
    try {
      const res = await api.put(`/etat_bilan/${id}`, data);
      return res.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Delete an etat bilan
  static async deleteEtatBilan(id) {
    try {
      const res = await api.delete(`/etat_bilan/${id}`);
      return res.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static handleError(error) {
    if (error.response) {
      console.error("API Error:", error.response.data.message || 'An error occurred');
    } else {
      console.error("Unexpected Error:", error);
    }
  }
}

export default EtatBilanService;
