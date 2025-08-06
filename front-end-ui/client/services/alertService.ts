import {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertFilters,
  AlertStats,
} from "@/types/alert";

const API_BASE_URL = "/api";

export class AlertService {
  static async getAllAlerts(
    page = 1,
    limit = 10,
    filters?: AlertFilters
  ): Promise<{ alerts: Alert[]; total: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.search) params.append("search", filters.search);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.level) params.append("level", filters.level);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`${API_BASE_URL}/alertes?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        alerts: Array.isArray(data) ? data : data.alerts || [],
        total: Array.isArray(data) ? data.length : data.total || 0,
      };
    } catch (error) {
      console.error("Error fetching alerts:", error);
      throw error;
    }
  }

  static async getAlert(id: number): Promise<Alert> {
    try {
      const response = await fetch(`${API_BASE_URL}/alertes/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching alert:", error);
      throw error;
    }
  }

  static async createAlert(alert: CreateAlertRequest): Promise<Alert> {
    try {
      const response = await fetch(`${API_BASE_URL}/alertes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alert),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
      const response = await fetch(`${API_BASE_URL}/alertes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alert),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating alert:", error);
      throw error;
    }
  }

  static async deleteAlert(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/alertes/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
      throw error;
    }
  }

  static async getAlertStats(): Promise<AlertStats> {
    try {
      const { alerts } = await this.getAllAlerts(1, 1000); // Get all alerts for stats
      
      const totalAlerts = alerts.length;
      const resolvedAlerts = alerts.filter(
        (alert) => alert.status === "résolue"
      ).length;
      const unresolvedAlerts = totalAlerts - resolvedAlerts;
      
      // Calculate average resolution time (mock calculation for now)
      // In a real scenario, you'd need resolution timestamps
      const averageResolutionTime = 2.5; // hours
      
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
