import axios from 'axios';
import { tokenManager } from './authService';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

export interface EtatBilan {
  id: number;
  id_bilan: number;
  nombre_tomates_maladies: number;
  nombre_tomates_non_maladies: number;
  nombre_malade1: number;
  nombre_malade2: number;
  temperature?: number;
  humidite?: number;
  luminosite?: number;
  co2?: number;
  rendement?: number;
  date: string;
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

export const etatBilanService = {
  // Get etat de bilan by bilan ID
  getEtatBilanByBilan: async (bilanId: number): Promise<EtatBilan[]> => {
    try {
      console.log('[EtatBilanService] Fetching etat de bilan for bilan:', bilanId);
      const response = await axios.get<EtatBilan[]>(
        `${API_BASE_URL}/etat_bilan/bilan/${bilanId}`,
        createAuthenticatedRequest()
      );
      
      console.log('[EtatBilanService] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EtatBilanService] Error:', error);
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération de l'état de bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get last etat de bilan by serre ID
  getLastEtatBilanBySerre: async (serreId: number): Promise<EtatBilan[]> => {
    try {
      console.log('[EtatBilanService] Fetching last etat de bilan for serre:', serreId);
      const response = await axios.get<EtatBilan[]>(
        `${API_BASE_URL}/etat_bilan/serre/${serreId}`,
        createAuthenticatedRequest()
      );
      
      console.log('[EtatBilanService] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EtatBilanService] Error:', error);
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération de l'état de bilan de la serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create new etat de bilan
  createEtatBilan: async (etatData: Partial<EtatBilan>): Promise<EtatBilan> => {
    try {
      console.log('[EtatBilanService] Creating etat de bilan:', etatData);
      const response = await axios.post<EtatBilan>(
        `${API_BASE_URL}/etat_bilan`,
        etatData,
        createAuthenticatedRequest()
      );
      
      console.log('[EtatBilanService] Created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EtatBilanService] Error:', error);
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création de l'état de bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update etat de bilan
  updateEtatBilan: async (etatId: number, etatData: Partial<EtatBilan>): Promise<EtatBilan> => {
    try {
      console.log('[EtatBilanService] Updating etat de bilan:', etatId, etatData);
      const response = await axios.put<EtatBilan>(
        `${API_BASE_URL}/etat_bilan/${etatId}`,
        etatData,
        createAuthenticatedRequest()
      );
      
      console.log('[EtatBilanService] Updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EtatBilanService] Error:', error);
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la mise à jour de l'état de bilan";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};

export default etatBilanService;
