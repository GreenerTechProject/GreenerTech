import axios from 'axios';
import api from '../axios/api';

const BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`; 

class EntrepriseService {
  static async createEntreprise(data) {
    try {
      const response = await axios.post(`${BASE_URL}/entreprise`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async getEntreprise() {
    try {
      const response = await api.get(`${BASE_URL}/entreprise`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async updateEntreprise(data) {
    try {
      const response = await api.put(`${BASE_URL}/entreprise`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async deleteEntreprise() {
    try {
      const response = await api.delete(`${BASE_URL}/entreprise`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

 

  static handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'Une erreur est survenue';
      console.error('API Error:', message);
    } else {
      console.error('Unexpected Error:', error);
    }
  }
}

export default EntrepriseService;
