import { z } from 'zod';
import axios from 'axios';

// Schema matching the backend Intervention model
export const InterventionSchema = z.object({
  id: z.number(),
  description: z.string(),
  status: z.enum(['encours', 'terminé']),
  date_debut: z.string().nullable(),
  date_fin: z.string().nullable(),
  total_charges: z.number(),
  id_user: z.number(),
  id_serre: z.number(),
  id_type_tache: z.number(),
  valid: z.boolean(),
});

export const CreateInterventionSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  id_serre: z.number(),
  id_type_tache: z.number(),
  total_charges: z.number().optional(),
  date_debut: z.string().optional(),
  date_fin: z.string().optional(),
});

export type Intervention = z.infer<typeof InterventionSchema>;
export type CreateInterventionData = z.infer<typeof CreateInterventionSchema>;

// Extended interface for UI display (includes related data)
export interface InterventionDisplay extends Intervention {
  user_name?: string;
  serre_name?: string;
  type_tache_nom?: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  serre?: {
    id: number;
    nom: string;
    domaine?: {
      id: number;
      nom: string;
    };
  };
  type_tache?: {
    id: number;
    nom: string;
  };
}

class InterventionService {
  private baseUrl = `${window.location.protocol}//${window.location.hostname}:5000/api`;

async getAllInterventions(): Promise<InterventionDisplay[]> {
  try {
    const response = await axios.get(`${this.baseUrl}/intervention`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      `Erreur lors de la récupération des interventions: ${error.response?.statusText || error.message}`
    );
  }
}

  async getIntervention(id: number): Promise<InterventionDisplay> {
    const response = await fetch(`${this.baseUrl}/intervention/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de l'intervention: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async createIntervention(interventionData: CreateInterventionData): Promise<Intervention> {
    const response = await fetch(`${this.baseUrl}/intervention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(interventionData),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la création de l'intervention: ${response.statusText}`);
    }

    const data = await response.json();
    return InterventionSchema.parse(data);
  }

  async validateIntervention(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/intervention/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la validation de l'intervention: ${response.statusText}`);
    }
  }

  // Helper methods for status translation
  getStatusLabel(status: 'encours' | 'terminé'): string {
    const statusLabels = {
      'encours': 'En cours',
      'terminé': 'Terminé',
    };
    return statusLabels[status];
  }

  getStatusColor(status: 'encours' | 'terminé'): string {
    const statusColors = {
      'encours': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'terminé': 'bg-green-100 text-green-800 border-green-200',
    };
    return statusColors[status];
  }

  // Helper method to get priority from type
  getTypePriority(typeName: string): 'low' | 'medium' | 'high' | 'urgent' {
    const priorities: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'Préparation du Sol': 'medium',
      'Plantation': 'high',
      'Palissage': 'medium',
      'Ébourgeonnage': 'low',
      'Effeuillage': 'medium',
      'Éclaircissage': 'low',
      'Maintenance': 'high',
      'Réparation': 'urgent',
      'Contrôle': 'medium',
    };
    return priorities[typeName] || 'medium';
  }

  getTypeIcon(typeName: string): string {
    const typeIcons: Record<string, string> = {
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
    return typeIcons[typeName] || '📋';
  }
}

export const interventionService = new InterventionService();
