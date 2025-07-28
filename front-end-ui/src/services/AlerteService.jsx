import axios from "axios";

const BASE_URL = "http://localhost:5000/alerte"; // Update if your Flask server has a different base

// Create a new alert
export async function createAlerte(data) {
  try {
    const response = await api.post(BASE_URL, data);
    return response.data;
  } catch (err) {
    throw new Error("Erreur lors de la création de l'alerte: " + err.response?.data?.message || err.message);
  }
}

// Get all alerts
export async function getAllAlertes() {
  try {
    const response = await api.get(BASE_URL);
    return response.data;
  } catch (err) {
    throw new Error("Erreur lors du chargement des alertes: " + err.response?.data?.message || err.message);
  }
}

// Get alert by ID
export async function getAlerte(id) {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (err) {
    throw new Error("Erreur lors de la récupération de l'alerte: " + err.response?.data?.message || err.message);
  }
}

// Update alert
export async function updateAlerte(id, updatedData) {
  try {
    const response = await api.put(`${BASE_URL}${id}`, updatedData);
    return response.data;
  } catch (err) {
    throw new Error("Erreur lors de la mise à jour de l'alerte: " + err.response?.data?.message || err.message);
  }
}

// Delete alert
export async function deleteAlerte(id) {
  try {
    const response = await api.delete(`${BASE_URL}${id}`);
    return response.data;
  } catch (err) {
    throw new Error("Erreur lors de la suppression de l'alerte: " + err.response?.data?.message || err.message);
  }
}
