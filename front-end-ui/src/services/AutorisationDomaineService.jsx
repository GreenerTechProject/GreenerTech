import axios from "./axiosInstance";

export async function createAutorisationDomaine(data) {
  const response = await axios.post("/autorisation_domaine", data);
  return response.data;
}

export async function getAutorisationDomaine(id_domaine) {
  const response = await axios.get("/autorisation_domaine", {
    params: { id_domaine },
  });
  return response.data;
}

export async function deleteAutorisationDomaine(id) {
  const response = await axios.delete(`/autorisation_domaine/${id}`);
  return response.data;
}
