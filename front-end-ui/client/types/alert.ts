export interface Alert {
  id: number;
  id_bilan: number;
  id_serre?: number;
  status_alert: number;
  maladie: string;
  lien_image?: string;
  x1?: number;
  y1?: number;
  date: string;
  status: "résolue" | "non résolue";
  // Enhanced location information
  bilan_nom?: string;
  serre_nom?: string;
  domaine_nom?: string;
}

export interface CreateAlertRequest {
  id_bilan: number;
  status_alert: number;
  maladie: string;
  lien_image?: string;
  x1?: number;
  y1?: number;
  status?: "résolue" | "non résolue";
}

export interface UpdateAlertRequest {
  status_alert?: number;
  maladie?: string;
  lien_image?: string;
  x1?: number;
  y1?: number;
  status?: "résolue" | "non résolue";
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  limit: number;
}

export interface AlertStats {
  totalAlerts: number;
  resolvedAlerts: number;
  unresolvedAlerts: number;
  averageResolutionTime: number; // in hours
}

export type AlertLevel = "High" | "Medium" | "Low";
export type AlertStatus = "résolue" | "non résolue";

export interface AlertFilters {
  search?: string;
  status?: AlertStatus;
  level?: AlertLevel;
  dateFrom?: string;
  dateTo?: string;
}
