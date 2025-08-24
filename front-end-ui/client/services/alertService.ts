import axios from "axios";
import { tokenManager } from "./authService";
import { Alert } from "@/types/alert";

export interface CreateAlertRequest {
  id_bilan: number;
  id_serre: number;
  maladie: string;
  status: "résolue" | "non résolue";
  status_alert: number;
}

export interface UpdateAlertRequest {
  status?: "résolue" | "non résolue";
  status_alert?: number;
}

export interface AlertStats {
  totalAlerts: number;
  resolvedAlerts: number;
  unresolvedAlerts: number;
  averageResolutionTime: number;
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

export const AlertService = {
  getAllAlerts: async (page: number = 1, limit: number = 10): Promise<{ alerts: Alert[]; total: number }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte`, {
        ...createAuthenticatedRequest(),
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des alertes";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getAlertsByAssignedSerres: async (): Promise<Alert[]> => {
    try {
      console.log("[DEBUG] Calling API endpoint:", `${API_BASE_URL}/alerte/assigned-serres`);
      const response = await axios.get(`${API_BASE_URL}/alerte/assigned-serres`, createAuthenticatedRequest());
      console.log("[DEBUG] API response status:", response.status);
      console.log("[DEBUG] API response data:", response.data);
      return response.data || [];
    } catch (error: any) {
      console.error("[DEBUG] API error:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des alertes par serres assignées";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getAlert: async (id: number): Promise<Alert> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération de l'alerte";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  createAlert: async (alert: CreateAlertRequest): Promise<Alert> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/alerte`, alert, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la création de l'alerte";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  updateAlert: async (id: number, updates: UpdateAlertRequest): Promise<Alert> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/alerte/${id}`, updates, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour de l'alerte";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  deleteAlert: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/alerte/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la suppression de l'alerte";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getAlertStats: async (): Promise<AlertStats> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/stats`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des statistiques d'alertes";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getAlertsByEnterprise: async (enterpriseId: number): Promise<Alert[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/entreprise/${enterpriseId}`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des alertes par entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getAlertsByDirectorEnterprise: async (): Promise<Alert[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/director-enterprise`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des alertes de l'entreprise du directeur";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};
