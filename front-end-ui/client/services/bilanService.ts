import axios from 'axios';

const API_BASE_URL = '/api';

interface Bilan {
  id: number;
  nom: string;
  description?: string;
  id_serre: number;
  date_creation: string;
  statut: string;
}

interface ApiError {
  message: string;
  status: number;
}

const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const bilanService = {
  // Get all bilans
  getAllBilans: async (): Promise<Bilan[]> => {
    try {
      const response = await axios.get<Bilan[]>(
        `${API_BASE_URL}/bilan`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des bilans";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get bilan by ID
  getBilan: async (bilanId: number): Promise<Bilan> => {
    try {
      const response = await axios.get<Bilan>(
        `${API_BASE_URL}/bilan/${bilanId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération du bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get bilans by serre ID
  getBilansBySerre: async (serreId: number): Promise<Bilan[]> => {
    try {
      const response = await axios.get<Bilan[]>(
        `${API_BASE_URL}/bilan/serre/${serreId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des bilans de la serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create new bilan
  createBilan: async (bilanData: Omit<Bilan, 'id' | 'date_creation'>): Promise<Bilan> => {
    try {
      const response = await axios.post<Bilan>(
        `${API_BASE_URL}/bilan`,
        bilanData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création du bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update bilan
  updateBilan: async (bilanId: number, bilanData: Partial<Bilan>): Promise<Bilan> => {
    try {
      const response = await axios.put<Bilan>(
        `${API_BASE_URL}/bilan/${bilanId}`,
        bilanData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la mise à jour du bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Delete bilan
  deleteBilan: async (bilanId: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/bilan/${bilanId}`,
        createAuthenticatedRequest()
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la suppression du bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};
