import api from '../axios/api'

export const createSerre = async (serreData) => {
  try {
    const response = await api.post('/serre', serreData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get all serres
export const getAllSerres = async () => {
  try {
    const response = await api.get('/serre');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get a single serre by ID
export const getSerreById = async (id) => {
  try {
    const response = await api.get(`/serre/${id}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Update a serre by ID
export const updateSerre = async (id, updatedData) => {
  try {
    const response = await api.put(`/serre/${id}`, updatedData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Delete a serre by ID
export const deleteSerre = async (id) => {
  try {
    const response = await api.delete(`/serre/${id}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get bilans for a specific serre
export const getBilansBySerre = async (idSerre) => {
  try {
    const response = await api.get(`/serre/${idSerre}/bilans`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// Get guides for a specific serre
export const getGuidesBySerre = async (idSerre) => {
  try {
    const response = await api.get(`/serre/${idSerre}/guides`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

// General error handler
const handleAxiosError = (error) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'Erreur serveur');
  } else if (error.request) {
    throw new Error('Aucune réponse du serveur');
  } else {
    throw new Error('Erreur : ' + error.message);
  }
};