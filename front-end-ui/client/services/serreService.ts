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

export interface UpdateSerreRequest {
  nom?: string;
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

export const serreService = {
  createSerre: async (serre: CreateSerreRequest): Promise<CreateSerreResponse> => {
    try {
      const authHeaders = createAuthenticatedRequest();
      
      const token = tokenManager.getToken();
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const newToken = refreshResponse.data.token;
          tokenManager.setToken(newToken);
          
          const newAuthHeaders = createAuthenticatedRequest();
          
          const response = await axios.post<CreateSerreResponse>(
            `${API_BASE_URL}/serre`,
            serre,
            newAuthHeaders,
          );
          return response.data;
        }
      } catch (refreshError) {
        // Token refresh failed, continuing with current token
      }
      
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/user`, authHeaders);
      } catch (authError: any) {
        throw new Error(`Authentication failed: ${authError.response?.data?.message || 'Unknown error'}`);
      }
      
      const response = await axios.post<CreateSerreResponse>(
        `${API_BASE_URL}/serre`,
        serre,
        authHeaders,
      );
      return response.data;
    } catch (error: any) {
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

  getSerresAssignedToUser: async (userId: number): Promise<any[]> => {
    try {
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
        // Could not fetch company technicians
      }

      const results: any[] = [];
      for (const id of serreIds) {
        try {
          const serreResponse = await axios.get(`${API_BASE_URL}/serre/${id}`, createAuthenticatedRequest());
          const serre = serreResponse.data;
          
          try {
            const techResponse = await axios.get(
              `${API_BASE_URL}/autorisation_serre`,
              {
                ...createAuthenticatedRequest(),
                params: { id_serre: id },
              }
            );
            
            const technicianAuths = techResponse.data?.data?.filter((auth: any) => {
              const isCurrentUser = auth.id_user === currentUser.id;
              return !isCurrentUser;
            }) || [];
            
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
                }
              }
              
              if (assignedTechnicians.length > 0) {
                serre.assignedTechnicians = assignedTechnicians;
              }
            }
          } catch (authError) {
            // Could not fetch technician assignments
          }
          
          results.push(serre);
        } catch (serreError) {
          // Could not fetch serre
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

  getAllSerresWithTechnicians: async (): Promise<any[]> => {
    try {
      console.log('DEBUG: getAllSerresWithTechnicians called');
      
      // First get all serres in the company
      const allSerresResponse = await axios.get(`${API_BASE_URL}/serre`, createAuthenticatedRequest());
      const allSerres = allSerresResponse.data;
      console.log('DEBUG: All serres fetched:', allSerres);
      
      // Get all technicians in the company
      const currentUserResponse = await axios.get(`${API_BASE_URL}/user`, createAuthenticatedRequest());
      const currentUser = currentUserResponse.data;
      console.log('DEBUG: Current user:', currentUser);
      
      let companyTechnicians: any[] = [];
      let companySupervisors: any[] = [];
      
      try {
        if (currentUser.id_entreprise) {
          // Fetch both technicians and supervisors
          const [techResponse, supResponse] = await Promise.all([
            axios.get(
              `${API_BASE_URL}/technicien/company/${currentUser.id_entreprise}`,
              createAuthenticatedRequest()
            ),
            axios.get(
              `${API_BASE_URL}/technicien/supervisors/company/${currentUser.id_entreprise}`,
              createAuthenticatedRequest()
            )
          ]);
          
          companyTechnicians = techResponse.data?.technicians || [];
          companySupervisors = supResponse.data?.supervisors || [];
          
          console.log('DEBUG: Company technicians fetched:', companyTechnicians);
          console.log('DEBUG: Company supervisors fetched:', companySupervisors);
        }
      } catch (techError) {
        console.error('Could not fetch company technicians/supervisors:', techError);
        // Try to fetch just technicians if supervisors endpoint fails
        try {
          if (currentUser.id_entreprise) {
            const techResponse = await axios.get(
              `${API_BASE_URL}/technicien/company/${currentUser.id_entreprise}`,
              createAuthenticatedRequest()
            );
            companyTechnicians = techResponse.data?.technicians || [];
            console.log('DEBUG: Company technicians fetched (fallback):', companyTechnicians);
          }
        } catch (fallbackError) {
          console.error('Could not fetch company technicians in fallback:', fallbackError);
        }
      }
      
      // Combine technicians and supervisors for lookup
      const allCompanyUsers = [...companyTechnicians, ...companySupervisors];
      console.log('DEBUG: All company users for lookup:', allCompanyUsers);
      
      // For each serre, get the assigned technicians
      const results: any[] = [];
      for (const serre of allSerres) {
        console.log(`DEBUG: Processing serre ${serre.id} (${serre.nom})`);
        
        try {
          const techResponse = await axios.get(
            `${API_BASE_URL}/autorisation_serre`,
            {
              ...createAuthenticatedRequest(),
              params: { id_serre: serre.id },
            }
          );
          
          const technicianAuths = techResponse.data?.data || [];
          console.log(`DEBUG: Autorisations for serre ${serre.id}:`, technicianAuths);
          
          if (technicianAuths.length > 0) {
            const assignedTechnicians = [];
            for (const techAuth of technicianAuths) {
              console.log(`DEBUG: Processing auth for user ${techAuth.id_user}`);
              const companyTech = allCompanyUsers.find((ct: any) => ct.id === techAuth.id_user);
              console.log(`DEBUG: Found company tech:`, companyTech);
              
              if (companyTech) {
                const techData = {
                  id: companyTech.id,
                  fullName: companyTech.fullName || companyTech.name || companyTech.email,
                  name: companyTech.name || companyTech.fullName || companyTech.email,
                  email: companyTech.email
                };
                console.log(`DEBUG: Adding tech data:`, techData);
                assignedTechnicians.push(techData);
              }
            }
            
            console.log(`DEBUG: Final assigned technicians for serre ${serre.id}:`, assignedTechnicians);
            
            if (assignedTechnicians.length > 0) {
              serre.assignedTechnicians = assignedTechnicians;
              console.log(`DEBUG: Set assignedTechnicians for serre ${serre.id}:`, serre.assignedTechnicians);
            }
          } else {
            console.log(`DEBUG: No autorisations found for serre ${serre.id}`);
          }
          
          results.push(serre);
        } catch (serreError) {
          console.error(`Could not fetch serre details for serre ${serre.id}:`, serreError);
          results.push(serre);
        }
      }
      
      console.log('DEBUG: Final results:', results);
      return results;
    } catch (error: any) {
      console.error('Error in getAllSerresWithTechnicians:', error);
      const errorMessage = error.response?.data?.message ||
        "Erreur lors de la récupération des serres avec techniciens";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

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
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création des serres";

      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

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
        const errorMessage = error.response?.data?.message || 
            "Failed to fetch serres";
        
        throw {
            message: errorMessage,
            status: error.response?.status || 500
        } as ApiError;
    }
},
  
  createAutorisationSerre: async (
    payload: { id_user: number; id_serre: number }
  ): Promise<AutorisationSerre> => {
    try {
      console.log('Creating autorisation serre with payload:', payload);
      console.log('API URL:', `${API_BASE_URL}/autorisation_serre`);
      
      const requestConfig = createAuthenticatedRequest();
      console.log('Request config:', requestConfig);
      
      const response = await axios.post<AutorisationSerre>(
        `${API_BASE_URL}/autorisation_serre`,
        payload,
        requestConfig
      );
      
      console.log('Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createAutorisationSerre:', error);
      console.error('Error response:', error.response);
      
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création d'autorisation serre";
      
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
  
  deleteAutorisationSerre: async (
    autorisationId: number
  ): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/autorisation_serre/${autorisationId}`,
        createAuthenticatedRequest()
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la suppression d'autorisation serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
  
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

  updateSerre: async (id: string | number, updates: UpdateSerreRequest, id_domaine?: string | number): Promise<{ message: string }> => {
    try {
      const updatePayload = {
        ...updates,
        ...(id_domaine && { id_domaine: typeof id_domaine === 'string' ? parseInt(id_domaine, 10) : id_domaine })
      };
      
      const response = await axios.put<{ message: string }>(
        `${API_BASE_URL}/serre/${id}`,
        updatePayload,
        createAuthenticatedRequest(),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la mise à jour de la serre";
      throw { message: errorMessage, status: error.response?.status || 500 } as ApiError;
    }
  },
};

export default serreService;
