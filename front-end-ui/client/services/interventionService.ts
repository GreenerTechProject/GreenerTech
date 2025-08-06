// Service for handling intervention-related API calls
import axios from 'axios';

const API_BASE_URL = '/api';

export interface Intervention {
  id: number;
  description: string;
  status: 'encours' | 'terminé';
  date_debut: string | null;
  date_fin: string | null;
  total_charges: number;
  id_user: number;
  id_serre: number;
  id_type_tache: number;
  valid: boolean;
}

export interface CreateInterventionData {
  description: string;
  id_serre: number;
  id_type_tache: number;
  total_charges?: number;
  date_debut?: string;
  date_fin?: string;
}

// Get authorization header with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// Get all interventions
export const getAllInterventions = async (): Promise<Intervention[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/interventions`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching interventions:', error);
    throw error;
  }
};

// Get single intervention by ID
export const getIntervention = async (id: number): Promise<Intervention> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/interventions/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching intervention:', error);
    throw error;
  }
};

// Create new intervention
export const createIntervention = async (data: CreateInterventionData): Promise<Intervention> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/interventions`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating intervention:', error);
    throw error;
  }
};

// Validate intervention (for directeur/technicien_superieur)
export const validateIntervention = async (id: number): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/interventions/${id}/validate`, {}, getAuthHeaders());
  } catch (error) {
    console.error('Error validating intervention:', error);
    throw error;
  }
};

// Helper function to get status display text and color
export const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'encours':
      return { text: 'En cours', color: 'bg-red-500' };
    case 'terminé':
      return { text: 'Terminé', color: 'bg-green-500' };
    default:
      return { text: status, color: 'bg-gray-500' };
  }
};

// Helper function to get intervention type icon and color
export const getInterventionTypeDisplay = (type: string) => {
  const typeMap: Record<string, { icon: string; color: string }> = {
    'Préparation du Sol': { icon: '🌱', color: 'bg-greener-500' },
    'Plantation': { icon: '🌲', color: 'bg-blue-600' },
    'Palissage': { icon: '📏', color: 'bg-yellow-500' },
    'Ébourgeonnage': { icon: '✂️', color: 'bg-purple-500' },
    'Effeuillage': { icon: '🍃', color: 'bg-green-600' },
    'Éclaircissage': { icon: '✂️', color: 'bg-orange-500' },
  };
  
  return typeMap[type] || { icon: '⚙️', color: 'bg-gray-500' };
};
