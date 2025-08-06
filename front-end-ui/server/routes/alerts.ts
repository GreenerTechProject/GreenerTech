import { RequestHandler } from "express";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export const handleGetAllAlertes: RequestHandler = async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/alerte`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

export const handleGetAlerte: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BACKEND_URL}/alerte/${id}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

export const handleUpdateAlerte: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.put(`${BACKEND_URL}/alerte/${id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Error updating alert:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
};

export const handleCreateAlerte: RequestHandler = async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/alerte`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ error: "Failed to create alert" });
  }
};

export const handleDeleteAlerte: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${BACKEND_URL}/alerte/${id}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
};
