import axios from "axios";
import { tokenManager } from "./authService";

export interface Company {
  id: number;
  nom: string;
  status_juridique?: string;
  adresse?: string;
  cie?: string;
  id_fiscale?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyRequest {
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export interface UpdateCompanyRequest {
  nom?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
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

export const companyService = {
  getAllCompanies: async (): Promise<Company[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/entreprise`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des entreprises";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getCompanyById: async (id: number): Promise<Company> => {
    try {
      // Use the existing backend endpoint: GET /api/entreprise
      // The backend automatically gets the company associated with the current user
      const response = await axios.get(`${API_BASE_URL}/entreprise`, createAuthenticatedRequest());
      // Since the backend returns an array, find the company with matching ID
      const companies = response.data || [];
      const company = companies.find((c: Company) => c.id === id);
      if (!company) {
        throw { message: "Entreprise non trouvée", status: 404 } as ApiError;
      }
      return company;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération de l'entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  getCompaniesByDirector: async (): Promise<Company[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/entreprise`, createAuthenticatedRequest());
      return response.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des entreprises du directeur";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  createCompany: async (companyData: CreateCompanyRequest): Promise<Company> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/entreprise`, companyData, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la création de l'entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  updateCompany: async (id: number, companyData: UpdateCompanyRequest): Promise<Company> => {
    try {
      // Use the existing backend endpoint: PUT /api/entreprise
      // The backend automatically gets the company associated with the current user
      const response = await axios.put(`${API_BASE_URL}/entreprise`, companyData, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour de l'entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  deleteCompany: async (id: number): Promise<{ message: string }> => {
    try {
      // Use the existing backend endpoint: DELETE /api/entreprise
      // The backend automatically deletes the company associated with the current user
      const response = await axios.delete(`${API_BASE_URL}/entreprise`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la suppression de l'entreprise";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};
