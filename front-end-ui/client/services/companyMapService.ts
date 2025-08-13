import axios from 'axios';
import { tokenManager } from './authService';
import { Domain } from './domainService';
import { ExtendedSerre } from '@shared/api';
import { Bilan } from './bilanService';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

export interface CompanyMapData {
  domains: DomainWithSerresAndBilans[];
}

export interface DomainWithSerresAndBilans extends Domain {
  serres: SerreWithBilans[];
}

export interface SerreWithBilans extends ExtendedSerre {
  bilans: Bilan[];
}

export interface ApiError {
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

export const companyMapService = {
  // Fetch all company data in one optimized call
  getCompanyMapData: async (companyId: string): Promise<CompanyMapData> => {
    try {
      console.log('[CompanyMapService] Attempting to fetch optimized data for company:', companyId);
      const response = await axios.get<CompanyMapData>(
        `${API_BASE_URL}/company/${companyId}/map-data`,
        createAuthenticatedRequest()
      );
      console.log('[CompanyMapService] Optimized endpoint response:', response.data);
      return response.data;
    } catch (error: any) {
      // Fallback to individual API calls if the optimized endpoint doesn't exist
      console.warn('[CompanyMapService] Optimized endpoint not available, falling back to individual calls:', error);
      return await companyMapService.getCompanyMapDataFallback(companyId);
    }
  },

  // Fallback method using individual API calls
  getCompanyMapDataFallback: async (companyId: string): Promise<CompanyMapData> => {
    try {
      console.log('[CompanyMapService] Using fallback method for company:', companyId);
      
      // Fetch domains
      const domainsResponse = await axios.get<{ success: boolean; domains: Domain[] }>(
        `${API_BASE_URL}/domains/company/${companyId}`,
        createAuthenticatedRequest()
      );

      if (!domainsResponse.data.success) {
        throw new Error('Failed to fetch domains');
      }

      const domains = domainsResponse.data.domains;
      console.log('[CompanyMapService] Fetched domains:', domains);
      
      const domainsWithSerresAndBilans: DomainWithSerresAndBilans[] = [];

      // Fetch serres and bilans for each domain
      for (const domain of domains) {
        try {
          // Fetch serres for this domain
          const serresResponse = await axios.get<{ success: boolean; serres: ExtendedSerre[] }>(
            `${API_BASE_URL}/domaine/${domain.id}/serres`,
            createAuthenticatedRequest()
          );

          const serres: SerreWithBilans[] = [];
          
          if (serresResponse.data.success) {
            console.log(`[CompanyMapService] Fetched serres for domain ${domain.id}:`, serresResponse.data.serres);
            
            // Fetch bilans for each serre
            for (const serre of serresResponse.data.serres) {
              try {
                const bilansResponse = await axios.get<Bilan[]>(
                  `${API_BASE_URL}/serre/${serre.id}/bilans`,
                  createAuthenticatedRequest()
                );
                
                console.log(`[CompanyMapService] Fetched bilans for serre ${serre.id}:`, bilansResponse.data);
                
                serres.push({
                  ...serre,
                  bilans: bilansResponse.data || []
                });
              } catch (bilanError) {
                console.warn(`[CompanyMapService] Failed to fetch bilans for serre ${serre.id}:`, bilanError);
                serres.push({
                  ...serre,
                  bilans: []
                });
              }
            }
          }

          domainsWithSerresAndBilans.push({
            ...domain,
            serres
          });
        } catch (serreError) {
          console.warn(`[CompanyMapService] Failed to fetch serres for domain ${domain.id}:`, serreError);
          domainsWithSerresAndBilans.push({
            ...domain,
            serres: []
          });
        }
      }

      const result = {
        domains: domainsWithSerresAndBilans
      };
      
      console.log('[CompanyMapService] Fallback method result:', result);
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la récupération des données de la carte";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create a new domain
  createDomain: async (domainData: {
    name: string;
    area: number;
    center: { lat: number; lng: number };
    path: { lat: number; lng: number; ordre: number }[];
    companyId: string;
  }): Promise<{ id: string; domainId?: string }> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/domaine`,
        domainData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création du domaine";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Create a new serre
  createSerre: async (serreData: {
    nom: string;
    id_domaine: number;
    position: { latitude: number; longitude: number; ordre: number }[];
    surface: number;
    center: { lat: number; lng: number };
  }): Promise<{ id: number; serreId?: string }> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/serre`,
        serreData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        "Erreur lors de la création de la serre";
      throw {
        message: errorMessage,
        status: error.response?.status || 500,
      } as ApiError;
    }
  }
};

export default companyMapService;
