import { z } from 'zod';

export const TypeTacheSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export type TypeTache = z.infer<typeof TypeTacheSchema>;

class TypeTacheService {
  private baseUrl = '/api';

  async getAllTypeTaches(): Promise<TypeTache[]> {
    const response = await fetch(`${this.baseUrl}/type_tache`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des types de tâches: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getTypeTache(id: number): Promise<TypeTache> {
    const response = await fetch(`${this.baseUrl}/type_tache/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du type de tâche: ${response.statusText}`);
    }

    const data = await response.json();
    return TypeTacheSchema.parse(data);
  }

  async createTypeTache(nom: string): Promise<TypeTache> {
    const response = await fetch(`${this.baseUrl}/type_tache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ nom }),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la création du type de tâche: ${response.statusText}`);
    }

    const data = await response.json();
    return TypeTacheSchema.parse(data);
  }

  // Helper method to get color for type
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

  // Helper method to get icon for type
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
