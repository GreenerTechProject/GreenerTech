import axios from 'axios';
import { tokenManager } from './authService';

// Use the correct backend port
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

interface Robot {
  id: number;
  nom: string;
  referance: string;
  id_entreprise: number;
}

interface ApiError {
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

export const robotService = {
  // Get all robots
  getAllRobots: async (): Promise<Robot[]> => {
    try {
      const response = await axios.get<Robot[]>(
        `${API_BASE_URL}/robot`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des robots";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get robot by ID
  getRobot: async (robotId: number): Promise<Robot> => {
    try {
      const response = await axios.get<Robot>(
        `${API_BASE_URL}/robot/${robotId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération du robot";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create new robot
  createRobot: async (robotData: Omit<Robot, 'id' | 'id_entreprise'>): Promise<{status: string, message: string, robot: Robot}> => {
    try {
      const response = await axios.post<{status: string, message: string, robot: Robot}>(
        `${API_BASE_URL}/robot`,
        robotData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création du robot";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update robot by ID
  updateRobot: async (robotId: number, robotData: Partial<Robot>): Promise<Robot> => {
    try {
      const response = await axios.put<Robot>(
        `${API_BASE_URL}/robot/${robotId}`,
        robotData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la mise à jour du robot";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Update robot by reference
  updateRobotByReference: async (robotData: { nom: string; referance: string }): Promise<Robot> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/robot`,
        robotData,
        createAuthenticatedRequest()
      );

      // Backend returns Robot object directly on success
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      let errorMessage = "Erreur lors de la mise à jour du robot";

      // Handle specific error cases with user-friendly messages
      if (status === 404) {
        errorMessage = `Aucun robot trouvé avec la référence "${robotData.referance}". Vérifiez que la référence est correcte ou créez d'abord le robot.`;
      } else if (status === 403) {
        errorMessage = "Vous n'avez pas l'autorisation de modifier ce robot.";
      } else if (status === 400) {
        errorMessage = errorData?.message || "Données invalides. Vérifiez le nom et la référence du robot.";
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.status === "error") {
        errorMessage = "Robot introuvable ou accès non autorisé";
      }

      throw {
        message: errorMessage,
        status: status || 500,
      } as ApiError;
    }
  },

  // Delete robot
  deleteRobot: async (robotId: number): Promise<{status: string, message: string}> => {
    try {
      const response = await axios.delete<{status: string, message: string}>(
        `${API_BASE_URL}/robot/${robotId}`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la suppression du robot";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};
