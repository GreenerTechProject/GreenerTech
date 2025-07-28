import api from '../axios/api'

// Register user (no auth token)
export const registerUser = async (userData) => {
  try {
    const response = await axios.post('/register', userData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Login user (no auth token)
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post('/login', credentials);
    return response.data; // { token, role }
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get current logged-in user (you need to pass token manually in your app)
export const getUser = async () => {
  try {
    const response = await api.get('/user');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Update current logged-in user
export const updateUser = async (updatedData) => {
  try {
    const response = await api.put('/user', updatedData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Delete current logged-in user
export const deleteUser = async () => {
  try {
    const response = await api.delete('/user');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Create a new technicien (only directeur role can do it on backend)
// Pass role and user data in body
export const createTechnicien = async (technicienData) => {
  try {
    const response = await api.post('/technicien', technicienData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};
