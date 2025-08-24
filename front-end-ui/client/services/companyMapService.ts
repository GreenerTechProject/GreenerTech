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
  guideData?: any; // Guide culture data fetched from API
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
      const response = await axios.get<CompanyMapData>(
        `${API_BASE_URL}/company/${companyId}/map-data`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error: any) {
      // Fallback to individual API calls if the optimized endpoint doesn't exist
      return await companyMapService.getCompanyMapDataFallback(companyId);
    }
  },

  // Fallback method using individual API calls
  getCompanyMapDataFallback: async (companyId: string): Promise<CompanyMapData> => {
    try {
      // Fetch domains
      const domainsResponse = await axios.get<{ success: boolean; domains: Domain[] }>(
        `${API_BASE_URL}/domains/company/${companyId}`,
        createAuthenticatedRequest()
      );

      if (!domainsResponse.data.success) {
        throw new Error('Failed to fetch domains');
      }

      const domains = domainsResponse.data.domains;
      
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
            // Fetch bilans for each serre
            for (const serre of serresResponse.data.serres) {
              try {
                const bilansResponse = await axios.get<Bilan[]>(
                  `${API_BASE_URL}/serre/${serre.id}/bilans`,
                  createAuthenticatedRequest()
                );
                
                serres.push({
                  ...serre,
                  bilans: bilansResponse.data || []
                });
              } catch (bilanError) {
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
          domainsWithSerresAndBilans.push({
            ...domain,
            serres: []
          });
        }
      }

      const result = {
        domains: domainsWithSerresAndBilans
      };
      
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
