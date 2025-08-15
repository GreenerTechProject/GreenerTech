import axios from 'axios';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

interface Robot {
  id: number;
  nom: string;
  referance: string;
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

export const robotService = {
  // Get all robots
  getAllRobots: async (): Promise<Robot[]> => {
    try {
      console.log('Fetching robots from:', `${API_BASE_URL}/robot`);
      const response = await axios.get<Robot[]>(
        `${API_BASE_URL}/robot`,
        createAuthenticatedRequest()
      );
      console.log('Robot response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Robot API error:', error);
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
  createRobot: async (robotData: Omit<Robot, 'id'>): Promise<Robot> => {
    try {
      const response = await axios.post<Robot>(
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

  // Update robot
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

  // Delete robot
  deleteRobot: async (robotId: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/robot/${robotId}`,
        createAuthenticatedRequest()
      );
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
