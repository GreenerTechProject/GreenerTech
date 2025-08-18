import axios from 'axios';
import { tokenManager } from './authService';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

export interface BilanPoint {
  lat: number;
  lng: number;
  ordre: number;
}

export interface Bilan {
  id: number;
  nom: string;
  id_serre: number;
  surface?: number;
  center_lat?: number;
  center_lng?: number;
  position: BilanPoint[];
}

export interface CreateBilanRequest {
  name: string;
  id_serre: number;
  position: BilanPoint[];
  area?: number;
  center?: {
    lat: number;
    lng: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
}

const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
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
      console.log('[BilanService] Fetching bilans for serre:', serreId);
      console.log('[BilanService] API URL:', `${API_BASE_URL}/serre/${serreId}/bilans`);
      
      const requestConfig = createAuthenticatedRequest();
      console.log('[BilanService] Request config:', requestConfig);
      
      const response = await axios.get<Bilan[]>(
        `${API_BASE_URL}/serre/${serreId}/bilans`,
        requestConfig
      );
      
      console.log('[BilanService] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[BilanService] Error:', error);
      console.error('[BilanService] Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des bilans de la serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create new bilan
  createBilan: async (bilanData: CreateBilanRequest): Promise<Bilan> => {
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
  },

  // Generate QR code for bilan
  generateBilanQRCode: async (bilanId: number): Promise<Blob> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/bilan/${bilanId}/qrcode`,
        {
          ...createAuthenticatedRequest(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la génération du QR code";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};
