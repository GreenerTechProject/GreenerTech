import axios from "axios";
import { tokenManager } from "./authService";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  telephone?: string;
  birthday?: string;
  id_entreprise?: number;
  setup_completed?: boolean;
  directeur_valide?: boolean;
  email_valide?: boolean;
}

export interface ApiError {
  message: string;
  status: number;
}

// Configure axios base URL - should match your backend
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Create axios instance with auth headers
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const userService = {
  // Delete current user account
  deleteUser: async (): Promise<void> => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/user`,
        createAuthenticatedRequest(),
      );
      
      if (response.status === 200) {
        console.log('[UserService] User account deleted successfully');
      } else {
        throw new Error('Failed to delete user account');
      }
    } catch (error: any) {
      console.error('[UserService] Error deleting user account:', error);
      throw {
        message: error.response?.data?.message || 'Failed to delete user account',
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get all technicians and superior technicians by company
  getTechniciansByCompany: async (companyId: number): Promise<User[]> => {
    try {
      console.log('[UserService] Fetching technicians for company:', companyId);
      console.log('[UserService] API URL:', `${API_BASE_URL}/technicien/alltypes/company/${companyId}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/technicien/alltypes/company/${companyId}`,
        createAuthenticatedRequest(),
      );

      console.log('[UserService] Response:', response.data);
      
      // Handle different response formats
      if (response.data?.success && response.data?.technicians) {
        console.log('[UserService] Success response with technicians array:', response.data.technicians);
        return response.data.technicians;
      } else if (Array.isArray(response.data)) {
        console.log('[UserService] Direct array response:', response.data);
        return response.data;
      } else if (response.data?.technicians && Array.isArray(response.data.technicians)) {
        console.log('[UserService] Response with technicians array (no success field):', response.data.technicians);
        return response.data.technicians;
      }
      
      console.log('[UserService] Unexpected response format, returning empty array');
      console.log('[UserService] Response data type:', typeof response.data);
      console.log('[UserService] Response data keys:', Object.keys(response.data || {}));
      return [];
    } catch (error: any) {
      console.error("Error fetching technicians by company:", error);
      return [];
    }
  },

  // Get technicians supervised by a specific supervisor
  getTechniciansBySupervisor: async (supervisorId: number): Promise<User[]> => {
    try {
      console.log('[UserService] Fetching technicians for supervisor:', supervisorId);
      
      const response = await axios.get(
        `${API_BASE_URL}/technicien/supervisor/${supervisorId}`,
        createAuthenticatedRequest(),
      );

      console.log('[UserService] Supervisor technicians response:', response.data);
      
      // Handle different response formats
      if (response.data?.success && response.data?.technicians) {
        return response.data.technicians;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.technicians && Array.isArray(response.data.technicians)) {
        return response.data.technicians;
      }
      
      return [];
    } catch (error: any) {
      console.error("Error fetching technicians by supervisor:", error);
      return [];
    }
  },

  // Get user by ID
  getUserById: async (userId: number): Promise<User | null> => {
    try {
      // Since we don't have a direct endpoint, we'll try to get from technicians list
      // This is a fallback approach
      const response = await axios.get(
        `${API_BASE_URL}/user`,
        createAuthenticatedRequest(),
      );

      if (response.data && response.data.id === userId) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  },
};

export default userService;
