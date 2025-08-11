import axios from "axios";
import {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertFilters,
  AlertStats,
} from "@/types/alert";

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

export class AlertService {
  static async getAllAlerts(
    page = 1,
    limit = 10,
    filters?: AlertFilters
  ): Promise<{ alerts: Alert[]; total: number }> {
    try {
      const params: any = {
        page,
        limit,
      };

      if (filters?.search) params.search = filters.search;
      if (filters?.status) params.status = filters.status;
      if (filters?.level) params.level = filters.level;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const response = await axios.get(`${API_BASE_URL}/alerte`, { params });

      const data = response.data;
      return {
        alerts: Array.isArray(data) ? data : data.alerts || [],
        total: Array.isArray(data) ? data.length : data.total || 0,
      };
    } catch (error) {
      console.error("Error fetching alerts:", error);
      throw error;
    }
  }

  static async getAlertsByAssignedSerres(): Promise<Alert[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/assigned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching alerts by assigned serres:", error);
      throw error;
    }
  }

  static async getAlert(id: number): Promise<Alert> {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerte/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching alert:", error);
      throw error;
    }
  }

  static async createAlert(alert: CreateAlertRequest): Promise<Alert> {
    try {
      const response = await axios.post(`${API_BASE_URL}/alerte`, alert);
      return response.data;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  }

  static async updateAlert(
    id: number,
    alert: UpdateAlertRequest
  ): Promise<Alert> {
    try {
      const response = await axios.put(`${API_BASE_URL}/alerte/${id}`, alert);
      return response.data;
    } catch (error) {
      console.error("Error updating alert:", error);
      throw error;
    }
  }

  static async deleteAlert(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/alerte/${id}`);
    } catch (error) {
      console.error("Error deleting alert:", error);
      throw error;
    }
  }

  static async getAlertStats(): Promise<AlertStats> {
    try {
      const { alerts } = await this.getAllAlerts(1, 1000);

      const totalAlerts = alerts.length;
      const resolvedAlerts = alerts.filter(
        (alert) => alert.status === "résolue"
      ).length;
      const unresolvedAlerts = totalAlerts - resolvedAlerts;
      const averageResolutionTime = 2.5; // mock

      return {
        totalAlerts,
        resolvedAlerts,
        unresolvedAlerts,
        averageResolutionTime,
      };
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      throw error;
    }
  }

  static getAlertLevel(statusAlert: number): "High" | "Medium" | "Low" {
    if (statusAlert >= 8) return "High";
    if (statusAlert >= 5) return "Medium";
    return "Low";
  }

  static getAlertLevelColor(level: "High" | "Medium" | "Low"): string {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  static getStatusColor(status: "résolue" | "non résolue"): string {
    return status === "résolue"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
