export interface MissionRobot {
  id?: number;
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut?: string;
  date_fin?: string;
  executed?: boolean;
}

export interface MissionResponse {
  status: string;
  message?: string;
  mission?: MissionRobot;
}

const API_BASE_URL = '/api';

class MissionService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createMission(mission: Omit<MissionRobot, 'id'>): Promise<MissionResponse> {
    return this.request<MissionResponse>('/missions', {
      method: 'POST',
      body: JSON.stringify(mission),
    });
  }

  async getAllMissions(): Promise<MissionRobot[]> {
    return this.request<MissionRobot[]>('/missions');
  }

  async getMission(missionId: number): Promise<MissionRobot> {
    return this.request<MissionRobot>(`/missions/${missionId}`);
  }

  async updateMission(missionId: number, mission: Partial<MissionRobot>): Promise<MissionResponse> {
    return this.request<MissionResponse>(`/missions/${missionId}`, {
      method: 'PUT',
      body: JSON.stringify(mission),
    });
  }

  async deleteMission(missionId: number): Promise<MissionResponse> {
    return this.request<MissionResponse>(`/missions/${missionId}`, {
      method: 'DELETE',
    });
  }
}

export const missionService = new MissionService();
