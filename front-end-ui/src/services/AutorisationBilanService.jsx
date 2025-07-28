import api from '../axios/api'

export const createAutorisationBilan = async (id_user, id_bilan) => {
  const response = await api.post('/autorisation_bilan', { id_user, id_bilan });
  return response.data;
};

export const getAutorisationBilan = async (id_bilan) => {
  const response = await api.get(`/autorisation_bilan`, { params: { id_bilan } });
  return response.data;
};

export const deleteAutorisationBilan = async (id) => {
  const response = await api.delete(`/autorisation_bilan/${id}`);
  return response.data;
};
