import axios from "axios";
import { tokenManager } from "./authService";

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

export interface ApiReport {
  id: number;
  date: string | null;
  description: string;
  lien_pdf?: string | null;
  serre?: string;
  serre_id?: number;
  domaine?: string;
  entreprise?: string;
  bilans?: string[];
  // Additional properties from backend
  serre_nom?: string;
  domaine_nom?: string;
  entreprise_nom?: string;
  user_nom?: string;
}

export interface CreateReportData {
  description: string;
  id_serre: number;
  date_debut?: string;
  date_fin?: string;
  ids_bilans: number[];
}

export class ReportService {
  static async createReport(reportData: CreateReportData): Promise<ApiReport> {
    try {
      const response = await axios.post<ApiReport>(
        `${API_BASE_URL}/rapport`,
        reportData,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getReportsByDirectorEnterprise(): Promise<ApiReport[]> {
    try {
      const response = await axios.get<ApiReport[]>(
        `${API_BASE_URL}/rapport/director-enterprise`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getReportsByAssignedSerres(): Promise<ApiReport[]> {
    try {
      const response = await axios.get<ApiReport[]>(
        `${API_BASE_URL}/rapport/assigned`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getReportsByUser(): Promise<ApiReport[]> {
    try {
      const response = await axios.get<ApiReport[]>(
        `${API_BASE_URL}/rapports/user`,
        createAuthenticatedRequest()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static getReportPdfUrl(lienPdf?: string | null): string | null {
    if (!lienPdf) return null;
    return `${window.location.protocol}//${window.location.hostname}:5000/${lienPdf}`;
  }

  static async downloadReport(lienPdf: string, filename = "rapport.pdf"): Promise<void> {
    const url = this.getReportPdfUrl(lienPdf);
    if (!url) return;
    const response = await axios.get(url, {
      ...createAuthenticatedRequest(),
      responseType: "blob",
    } as any);
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  static async deleteReport(reportId: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/rapport/${reportId}`,
        createAuthenticatedRequest()
      );
    } catch (error) {
      throw error;
    }
  }
}

export default ReportService;


