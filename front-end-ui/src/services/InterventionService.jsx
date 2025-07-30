import axios from './axiosInstance';
import api from '../axios/api'

export const createIntervention = async (interventionData) => {
  try {
    const response = await api.post('/intervention', interventionData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

export const validateIntervention = async (id) => {
  try {
    const response = await api.put(`/intervention/${id}/validate`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const handleAxiosError = (error) => {
  if (error.response) {
    throw new Error(error.response.data?.error || error.response.data?.message || 'Une erreur est survenue.');
  } else if (error.request) {
    throw new Error('Aucune réponse du serveur.');
  } else {
    throw new Error(error.message || 'Erreur inconnue.');
  }
};
