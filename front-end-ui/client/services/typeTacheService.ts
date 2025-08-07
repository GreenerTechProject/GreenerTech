import { z } from 'zod';
import axios from 'axios';
import { tokenManager } from "./authService";

// Zod schema for validation
export const TypeTacheSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export type TypeTache = z.infer<typeof TypeTacheSchema>;

// Auth headers helper
const createAuthenticatedRequest = () => {
  const token = tokenManager.getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

class TypeTacheService {
  private baseUrl = `${window.location.protocol}//${window.location.hostname}:5000/api`;

  // GET all types
  async getAllTypeTaches(): Promise<TypeTache[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/types-tache`, createAuthenticatedRequest());
      return response.data;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des types de tâches: ${error.message}`);
    }
  }

  // GET by ID
  async getTypeTache(id: number): Promise<TypeTache> {
    try {
      const response = await axios.get(`${this.baseUrl}/types-tache/${id}`, createAuthenticatedRequest());
      return TypeTacheSchema.parse(response.data);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération du type de tâche: ${error.message}`);
    }
  }

  // POST new type
  async createTypeTache(nom: string): Promise<TypeTache> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/types-tache`,
        { nom },
        createAuthenticatedRequest()
      );
      return TypeTacheSchema.parse(response.data);
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du type de tâche: ${error.message}`);
    }
  }

  // Style color mapping
  getTypeColor(nom: string): string {
    const colors: Record<string, string> = {
      'Préparation du Sol': 'bg-green-100 text-green-800 border-green-200',
      'Plantation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Palissage': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Ébourgeonnage': 'bg-purple-100 text-purple-800 border-purple-200',
      'Effeuillage': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Éclaircissage': 'bg-orange-100 text-orange-800 border-orange-200',
      'Maintenance': 'bg-blue-100 text-blue-800 border-blue-200',
      'Réparation': 'bg-red-100 text-red-800 border-red-200',
      'Contrôle': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[nom] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  // Emoji icon mapping
  getTypeIcon(nom: string): string {
    const icons: Record<string, string> = {
      'Préparation du Sol': '🌱',
      'Plantation': '🌲',
      'Palissage': '📏',
      'Ébourgeonnage': '✂️',
      'Effeuillage': '🍃',
      'Éclaircissage': '🔍',
      'Maintenance': '🔧',
      'Réparation': '⚡',
      'Contrôle': '📊',
    };
    return icons[nom] || '📋';
  }
}

export const typeTacheService = new TypeTacheService();
