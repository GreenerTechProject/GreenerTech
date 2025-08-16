import axios from 'axios';
import { tokenManager } from './authService';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

interface Mission {
  id: number;
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut: string;
  date_fin: string | null;
  executed: boolean;
}

interface CreateMissionRequest {
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut: string;
  date_fin?: string | null;
  executed?: boolean;
}

interface ApiError {
  message: string;
  status: number;
}

const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  console.log('Auth token:', token ? 'Present' : 'Missing');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const missionService = {
  // Get all missions
  getAllMissions: async (): Promise<Mission[]> => {
    try {
      console.log('Fetching missions from:', `${API_BASE_URL}/mission_robot`);
      console.log('Auth headers:', createAuthenticatedRequest());
      
      const response = await axios.get<Mission[]>(
        `${API_BASE_URL}/mission_robot`,
        createAuthenticatedRequest()
      );
      
      console.log('Mission response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Mission API error:', error);
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des missions";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get mission by ID
  getMission: async (missionId: number): Promise<Mission> => {
    try {
      const response = await axios.get<Mission>(
        `${API_BASE_URL}/mission_robot/${missionId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération de la mission";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create new mission
  createMission: async (missionData: CreateMissionRequest): Promise<Mission> => {
    try {
      const response = await axios.post<Mission>(
        `${API_BASE_URL}/mission_robot`,
        missionData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création de la mission";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update mission
  updateMission: async (missionId: number, missionData: Partial<CreateMissionRequest>): Promise<Mission> => {
    try {
      const response = await axios.put<Mission>(
        `${API_BASE_URL}/mission_robot/${missionId}`,
        missionData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la mise à jour de la mission";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Delete mission
  deleteMission: async (missionId: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/mission_robot/${missionId}`,
        createAuthenticatedRequest()
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la suppression de la mission";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};
