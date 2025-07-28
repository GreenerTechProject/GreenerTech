// src/services/autorisationSerreService.js
import axios from "./axiosInstance";

export async function createAutorisationSerre(data) {
  const response = await axios.post("/autorisation_serre", data);
  return response.data;
}

export async function getAutorisationSerre(id_serre) {
  const response = await axios.get("/autorisation_serre", {
    params: { id_serre },
  });
  return response.data;
}

export async function deleteAutorisationSerre(id) {
  const response = await axios.delete(`/autorisation_serre/${id}`);
  return response.data;
}
