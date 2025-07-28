// src/services/robotService.js
import axios from './axiosInstance';
import api from '../axios/api'

// Create a new robot
export const createRobot = async (robotData) => {
  try {
    const response = await api.post('/robot', robotData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get all robots
export const getAllRobots = async () => {
  try {
    const response = await api.get('/robot');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get robot by ID
export const getRobotById = async (robotId) => {
  try {
    const response = await api.get(`/robot/${robotId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Update robot
export const updateRobot = async (robotId, updatedData) => {
  try {
    const response = await api.put(`/robot/${robotId}`, updatedData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Delete robot
export const deleteRobot = async (robotId) => {
  try {
    const response = await api.delete(`/robot/${robotId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};
