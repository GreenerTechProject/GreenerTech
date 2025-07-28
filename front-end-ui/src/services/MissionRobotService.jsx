import axios from './axiosInstance'; 
import api from '../axios/api'

// Helper error handler
const handleAxiosError = (error) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'Une erreur est survenue');
  } else if (error.request) {
    throw new Error('Aucune réponse du serveur');
  } else {
    throw new Error(error.message || 'Erreur inconnue');
  }
};

// Create a new mission robot (POST /mission-robot)
export const createMissionRobot = async (missionData) => {
  try {
    const response = await api.post('/mission-robot', missionData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get all mission robots (GET /mission-robot)
export const getAllMissionsRobot = async () => {
  try {
    const response = await api.get('/mission-robot');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get one mission robot by ID (GET /mission-robot/:id)
export const getMissionRobot = async (missionId) => {
  try {
    const response = await api.get(`/mission-robot/${missionId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Update mission robot by ID (PUT /mission-robot/:id)
export const updateMissionRobot = async (missionId, updatedData) => {
  try {
    const response = await api.put(`/mission-robot/${missionId}`, updatedData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Delete mission robot by ID (DELETE /mission-robot/:id)
export const deleteMissionRobot = async (missionId) => {
  try {
    const response = await api.delete(`/mission-robot/${missionId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};
