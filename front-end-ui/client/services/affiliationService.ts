import axios from "axios";
import { tokenManager } from "./authService";

export interface PendingTechnician {
  id: number;
  name: string;
  email: string;
  role: "technicien" | "technicien_superieur";
  birthday?: string;
  telephone?: string;
  cin?: string;
  id_assigned?: number;
  directeur_valide: boolean;
  email_valide: boolean;
  created_at: string;
  id_entreprise?: number;
  // Additional fields that might be available
  experience?: string;
  motivation?: string;
  skills?: string[];
  availability?: string;
  company?: string;
  location?: string;
  documents?: {
    cv?: string;
    certifications?: string[];
    recommendations?: string[];
  };
  references?: {
    name: string;
    position: string;
    company: string;
    contact: string;
  }[];
  rejection_reason?: string;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
}

// Configure axios base URL
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

export const affiliationService = {
  // Get all pending technicians (directeur_valide = false)
  getPendingTechnicians: async (): Promise<PendingTechnician[]> => {
    try {
      const response = await axios.get<{
        success: boolean;
        technicians: PendingTechnician[];
      }>(`${API_BASE_URL}/technicien/pending`,
        createAuthenticatedRequest());
  
      if (response.data?.success) {
        return response.data.technicians;
      }
      
      return [];
    } catch (error: any) {
      console.error("Error fetching pending technicians:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch pending technicians",
        status: error.response?.status || 500,
      };
    }
  },

  // Get all technicians for affiliation management
  getAllTechnicians: async (): Promise<PendingTechnician[]> => {
    try {
      const response = await axios.get<PendingTechnician[]>(
        `${API_BASE_URL}/technicien/all`,
        createAuthenticatedRequest());
  
      return response.data;
    } catch (error: any) {
      console.error("Error fetching all technicians:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch technicians",
        status: error.response?.status || 500,
      };
    }
  },

  // Validate a technician (set directeur_valide = true)
  validateTechnician: async (technicianId: number): Promise<ValidationResponse> => {
    try {
      const response = await axios.put<ValidationResponse>(
        `${API_BASE_URL}/technicien/validate/${technicianId}`,
        { directeur_valide: true },
        createAuthenticatedRequest());
  
      return response.data;
    } catch (error: any) {
      console.error("Error validating technician:", error);
      throw {
        message: error.response?.data?.message || "Failed to validate technician",
        status: error.response?.status || 500,
      };
    }
  },

  // Reject a technician (set directeur_valide = false)
  rejectTechnician: async (technicianId: number, reason?: string): Promise<ValidationResponse> => {
    try {
      const response = await axios.put<ValidationResponse>(
        `${API_BASE_URL}/technicien/validate/${technicianId}`,
        { 
          directeur_valide: false,
          rejection_reason: reason 
        },
        createAuthenticatedRequest());
  
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting technician:", error);
      throw {
        message: error.response?.data?.message || "Failed to reject technician",
        status: error.response?.status || 500,
      };
    }
  },

  // Get technicians by company with validation status
  getTechniciansByCompany: async (companyId: string): Promise<PendingTechnician[]> => {
    try {
      const response = await axios.get<{
        success: boolean;
        technicians: PendingTechnician[];
      }>(`${API_BASE_URL}/technicien/company/${companyId}`,
        createAuthenticatedRequest());
  
      if (response.data?.success) {
        return response.data.technicians;
      }
      
      return [];
    } catch (error: any) {
      console.error("Error fetching company technicians:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch company technicians",
        status: error.response?.status || 500,
      };
    }
  }
};
