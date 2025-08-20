import axios from "axios";
import { tokenManager } from "./authService";
import { ExtendedSerre } from "@shared/api";

export interface CreateSerreRequest {
  nom: string;
  id_domaine: number;
  position?: {
    latitude: number;
    longitude: number;
    ordre: number;
  }[];
  surface?: number;
  center?: {
    lat: number;
    lng: number;
  };
}

export interface CreateSerreResponse {
  id?: number;
  serreId?: string;
  nom: string;
  id_domaine: number;
  position?: {
    id: number;
    lat: number;
    lng: number;
    ordre: number;
  }[];
}

export interface ApiError {
  message: string;
  status: number;
}

export interface AutorisationSerre {
  id: number;
  id_user: number;
  id_serre: number;
}

// Configure axios base URL - use correct backend port
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Create axios instance with auth headers
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  console.log("=== AUTH DEBUG ===");
  console.log("Token exists:", !!token);
  console.log("Token value:", token ? `${token.substring(0, 20)}...` : "null");
  console.log("Headers:", {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  });
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const serreService = {
  // Create a single serre
  createSerre: async (serre: CreateSerreRequest): Promise<CreateSerreResponse> => {
    try {
      console.log("=== SERRE CREATION DEBUG ===");
      console.log("Creating serre:", serre);
      console.log("API URL:", `${API_BASE_URL}/serre`);
      console.log("Request data:", JSON.stringify(serre, null, 2));
      
      const authHeaders = createAuthenticatedRequest();
      console.log("Auth headers:", authHeaders);
      
      // Check if token exists and is valid
      const token = tokenManager.getToken();
      console.log("=== TOKEN DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token ? token.length : 0);
      console.log("Token preview:", token ? `${token.substring(0, 50)}...` : "null");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // Try to refresh token if it might be expired
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          console.log("Attempting token refresh...");
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const newToken = refreshResponse.data.token;
          tokenManager.setToken(newToken);
          console.log("Token refreshed successfully");
          
          // Update auth headers with new token
          const newAuthHeaders = createAuthenticatedRequest();
          console.log("New auth headers:", newAuthHeaders);
          
          const response = await axios.post<CreateSerreResponse>(
            `${API_BASE_URL}/serre`,
            serre,
            newAuthHeaders,
          );
          console.log("Serre creation response:", response.data);
          return response.data;
        }
      } catch (refreshError) {
        console.log("Token refresh failed, continuing with current token:", refreshError);
      }
      
      // Test authentication first
      try {
        console.log("Testing authentication...");
        const testResponse = await axios.get(`${API_BASE_URL}/user`, authHeaders);
        console.log("Auth test successful:", testResponse.data);
        console.log("User role:", testResponse.data?.role);
        console.log("User ID:", testResponse.data?.id);
      } catch (authError: any) {
        console.error("Auth test failed:", authError.response?.status, authError.response?.data);
        throw new Error(`Authentication failed: ${authError.response?.data?.message || 'Unknown error'}`);
      }
      
      console.log("=== FINAL SERRE REQUEST ===");
      console.log("URL:", `${API_BASE_URL}/serre`);
      console.log("Headers:", JSON.stringify(authHeaders, null, 2));
      console.log("Data:", JSON.stringify(serre, null, 2));
      
      const response = await axios.post<CreateSerreResponse>(
        `${API_BASE_URL}/serre`,
        serre,
        authHeaders,
      );
      console.log("Serre creation response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      return response.data;
    } catch (error: any) {
      console.error("=== SERRE CREATION ERROR ===");
      console.error("Erreur lors de la création de la serre:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de la serre";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  getSerre: async (id: string | number): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/serre/${id}`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération de la serre";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },


  deleteSerre: async (id: string | number, id_domaine: string | number): Promise<{ message: string }> => {
    try {
      const auth = createAuthenticatedRequest();
      const response = await axios.delete<{ message: string }>(
        `${API_BASE_URL}/serre/${id}`,
        {
          ...auth,
          data: { id_domaine: typeof id_domaine === 'string' ? parseInt(id_domaine, 10) : id_domaine },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la suppression de la serre";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get serres assigned to a given user (by autorisations)
  getSerresAssignedToUser: async (userId: number): Promise<any[]> => {
    try {
      // Fetch autorisations for this user
      const authzResp = await axios.get(
        `${API_BASE_URL}/autorisation_serre`,
        {
          ...createAuthenticatedRequest(),
          params: { id_user: userId },
        },
      );

      const autorisations = authzResp.data?.data || [];
      const serreIds: number[] = autorisations.map((a: any) => a.id_serre);
      if (serreIds.length === 0) return [];

      const results: any[] = [];
      for (const id of serreIds) {
        try {
          const r = await axios.get(`${API_BASE_URL}/serre/${id}`, createAuthenticatedRequest());
          results.push(r.data);
        } catch (_) {}
      }
      return results;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres assignées";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  getSerresWithTechnicians: async (): Promise<any[]> => {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/user`, createAuthenticatedRequest());
      const currentUser = userResponse.data;
      
      const authzResp = await axios.get(
        `${API_BASE_URL}/autorisation_serre`,
        {
          ...createAuthenticatedRequest(),
          params: { id_user: currentUser.id },
        },
      );

      const autorisations = authzResp.data?.data || [];
      const serreIds: number[] = autorisations.map((a: any) => a.id_serre);
      if (serreIds.length === 0) return [];

      // Fetch company technicians to get their details
      let companyTechnicians: any[] = [];
      try {
        if (currentUser.id_entreprise) {
          const techResponse = await axios.get(
            `${API_BASE_URL}/technicien/company/${currentUser.id_entreprise}`,
            createAuthenticatedRequest()
          );
          companyTechnicians = techResponse.data?.technicians || [];
        }
      } catch (techError) {
        console.warn('Could not fetch company technicians:', techError);
      }

      // Fetch details for each serre with technician information
      const results: any[] = [];
      for (const id of serreIds) {
        try {
          const serreResponse = await axios.get(`${API_BASE_URL}/serre/${id}`, createAuthenticatedRequest());
          const serre = serreResponse.data;
          
          // Fetch technician assignments for this serre
          try {
            const techResponse = await axios.get(
              `${API_BASE_URL}/autorisation_serre`,
              {
                ...createAuthenticatedRequest(),
                params: { id_serre: id },
              }
            );
            
            console.log(`[SerreService] Fetching technicians for serre ${id}:`, techResponse.data);
            
            // Find all technician assignments (not the current user's assignment)
            const technicianAuths = techResponse.data?.data?.filter((auth: any) => {
              // Only filter out the current user's own assignment
              const isCurrentUser = auth.id_user === currentUser.id;
              console.log(`[SerreService] Auth ${auth.id_user} vs current user ${currentUser.id}: ${isCurrentUser}`);
              return !isCurrentUser;
            }) || [];
            
            console.log(`[SerreService] Found ${technicianAuths.length} technician assignments for serre ${id}:`, technicianAuths);
            
            if (technicianAuths.length > 0) {
              const assignedTechnicians = [];
              for (const techAuth of technicianAuths) {
                const companyTech = companyTechnicians.find((ct: any) => ct.id === techAuth.id_user);
                if (companyTech) {
                  assignedTechnicians.push({
                    id: companyTech.id,
                    name: companyTech.fullName || companyTech.name || companyTech.email,
                    email: companyTech.email
                  });
                  console.log(`[SerreService] Found technician:`, companyTech);
                } else {
                  console.log(`[SerreService] Technician ${techAuth.id_user} not found in company technicians`);
                }
              }
              
              if (assignedTechnicians.length > 0) {
                serre.assignedTechnicians = assignedTechnicians;
                console.log(`[SerreService] Set assignedTechnicians for serre ${id}:`, assignedTechnicians);
              } else {
                console.log(`[SerreService] No valid technicians found for serre ${id}`);
              }
            } else {
              console.log(`[SerreService] No technician assignments found for serre ${id}`);
            }
          } catch (authError) {
            console.warn(`Could not fetch technician assignments for serre ${id}:`, authError);
          }
          
          results.push(serre);
        } catch (serreError) {
          console.warn(`Could not fetch serre ${id}:`, serreError);
        }
      }
      
      return results;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres avec techniciens";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get serres assigned to the current user
  getSerresByUser: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/serre/user`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres de l'utilisateur";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create multiple serres (optional - keep if you need bulk creation)
  createSerres: async (
    serres: CreateSerreRequest[],
  ): Promise<CreateSerreResponse[]> => {
    try {
      const results: CreateSerreResponse[] = [];

      for (const serre of serres) {
        const response = await axios.post<CreateSerreResponse>(
          `${API_BASE_URL}/serre`,
          serre,
          createAuthenticatedRequest(),
        );
        results.push(response.data);
      }

      return results;
    } catch (error: any) {
      console.error("Erreur lors de la création des serres:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des serres";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },


  // Get serres by domain ID
  getSerresByDomain: async (domainId: string): Promise<ExtendedSerre[]> => {
    try {
      const response = await axios.get<{ success: boolean; serres: ExtendedSerre[] }>(
        `${API_BASE_URL}/domaine/${domainId}/serres`,
        createAuthenticatedRequest(),
      );

      if (response.data.success) {
        return response.data.serres;
      } else {
        throw new Error("Échec de la récupération des serres");
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des serres:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des serres";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

getAllSerres: async (): Promise<ExtendedSerre[]> => {
    try {
        const response = await axios.get<ExtendedSerre[]>(
            `${API_BASE_URL}/serre`,
            createAuthenticatedRequest()
        );
        
        return response.data;
    } catch (error: any) {
        console.error("Error fetching all serres:", error);

        const errorMessage = error.response?.data?.message || 
            "Failed to fetch serres";
        
        throw {
            message: errorMessage,
            status: error.response?.status || 500
        } as ApiError;
    }
},
  
  // Create an autorisation for a user to access a serre
  createAutorisationSerre: async (
    payload: { id_user: number; id_serre: number }
  ): Promise<AutorisationSerre> => {
    try {
      const response = await axios.post<AutorisationSerre>(
        `${API_BASE_URL}/autorisation_serre`,
        payload,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création d'autorisation serre:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création d'autorisation serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
  
  // Get bilans by serre
  getBilansBySerre: async (serreId: number): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/${serreId}/bilans`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des bilans";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get guides by serre to extract 'variete'
  getGuidesBySerre: async (serreId: number): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/${serreId}/guides`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des guides";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },

  // Get autorisations for serres filtered by user or serre
  getAutorisationSerre: async (
    params: { id_user?: number; id_serre?: number }
  ): Promise<AutorisationSerre[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/autorisation_serre`,
        {
          ...createAuthenticatedRequest(),
          params,
        }
      );
      const list = (response.data?.data ?? []) as AutorisationSerre[];
      return list;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des autorisations serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get serres assigned to the current user using the new backend endpoint
  getSerresByCurrentUser: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/serre/user`,
        createAuthenticatedRequest()
      );
      return response.data as any[];
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la récupération des serres de l'utilisateur";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default serreService;
