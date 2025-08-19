import axios from "axios";
import { tokenManager } from "./authService";

export interface Notification {
  id: number;
  description: string;
  status: 'non_vue' | 'vue';
  date: string;
  id_intervention?: number;
  type_notification: string;
}

export interface NotificationCounts {
  total: number;
  non_vue: number;
  vue: number;
  byType: {
    intervention_creee: number;
    intervention_validee: number;
    compte_technicien: number;
    compte_valide: number;
  };
}

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

export const notificationService = {
  // Get all notifications for current user - CORRECT ENDPOINT
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get notification counts for TechHeader
  async getNotificationCounts(): Promise<NotificationCounts> {
    try {
      const notifications = await this.getNotifications();
      
      const counts: NotificationCounts = {
        total: notifications.length,
        non_vue: notifications.filter(n => n.status === 'non_vue').length,
        vue: notifications.filter(n => n.status === 'vue').length,
        byType: {
          intervention_creee: notifications.filter(n => n.type_notification === 'intervention_creee').length,
          intervention_validee: notifications.filter(n => n.type_notification === 'intervention_validee').length,
          compte_technicien: notifications.filter(n => n.type_notification === 'compte_technicien').length,
          compte_valide: notifications.filter(n => n.type_notification === 'compte_valide').length,
        }
      };
      
      return counts;
    } catch (error) {
      console.error('Error getting notification counts:', error);
      return {
        total: 0,
        non_vue: 0,
        vue: 0,
        byType: {
          intervention_creee: 0,
          intervention_validee: 0,
          compte_technicien: 0,
          compte_valide: 0,
        }
      };
    }
  },

  // Get tech sup specific notifications - CORRECT ENDPOINT
  async getTechSupNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, createAuthenticatedRequest());
      return response.data;
    } catch (error) {
      console.error('Error fetching tech sup notifications:', error);
      return [];
    }
  },

  // Mark notification as seen - CORRECT ENDPOINT
  async markAsSeen(notificationId: number): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/notifications/vue/${notificationId}`, {}, createAuthenticatedRequest());
    } catch (error) {
      console.error('Error marking notification as seen:', error);
      throw error;
    }
  },

  // Mark all notifications as seen for current user
  async markAllAsSeen(): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/notifications/mark-all-vue`, {}, createAuthenticatedRequest());
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      throw error;
    }
  }
};
