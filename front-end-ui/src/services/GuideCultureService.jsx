import api from '../axios/api'

const BASE_URL = `http://${window.location.hostname}:5000/api`; 

class GuideCultureService {
  static async createGuideCulture(data) {
    try {
      const response = await api.post(`${BASE_URL}/guide_culture`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async updateGuideCulture(id, data) {
    try {
      const response = await api.put(`${BASE_URL}/guide_culture/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async getGuideCulture(id) {
    try {
      const response = await api.get(`${BASE_URL}/guide_culture/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async getAllGuides() {
    try {
      const response = await api.get(`${BASE_URL}/guide_culture`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static async deleteGuideCulture(id) {
    try {
      const response = await api.delete(`${BASE_URL}/guide_culture/${id}`);
      return response.data;
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

export default GuideCultureService;
