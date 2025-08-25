import axios from "axios";
import { tokenManager } from "./authService";

export interface Bilan {
  id: number;
  nom: string;
  id_serre: number;
  serre_nom?: string;
  domaine_nom?: string;
  lien_pdf?: string;
  status?: string;
  surface?: number;
  position?: Array<{
    point_x?: number;
    point_y?: number;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  }>;
}

export interface CreateBilanRequest {
  nom: string;
  description?: string;
  date: string;
  id_serre: number;
}

export interface UpdateBilanRequest {
  nom?: string;
  description?: string;
  date?: string;
  lien_pdf?: string;
  status?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const bilanService = {
  getAllBilans: async (): Promise<Bilan[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bilan`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des bilans";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getBilan: async (id: number): Promise<Bilan> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bilan/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération du bilan";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  createBilan: async (bilan: CreateBilanRequest): Promise<Bilan> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bilan`, bilan, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la création du bilan";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  updateBilan: async (id: number, updates: UpdateBilanRequest): Promise<Bilan> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/bilan/${id}`, updates, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour du bilan";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  deleteBilan: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/bilan/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la suppression du bilan";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getBilansBySerre: async (serreId: number): Promise<Bilan[]> => {
    try {
      const requestConfig = createAuthenticatedRequest();
      const response = await axios.get(`${API_BASE_URL}/serre/${serreId}/bilans`, requestConfig);
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des bilans de la serre";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getBilansByEnterprise: async (enterpriseId: number): Promise<Bilan[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bilan/enterprise/${enterpriseId}`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des bilans de l'entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  downloadBilan: async (lienPdf: string, filename: string): Promise<void> => {
    try {
      const response = await axios.get(lienPdf, {
        ...createAuthenticatedRequest(),
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors du téléchargement du bilan";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  generateBilanQRCode: async (bilanId: number): Promise<Blob> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bilan/${bilanId}/qrcode`, {
        ...createAuthenticatedRequest(),
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la génération du QR Code";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};
