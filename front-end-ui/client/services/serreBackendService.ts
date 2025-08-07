import { z } from 'zod';

export const PointGpsSchema = z.object({
  id: z.number(),
  lat: z.number(), // point_x in backend
  lng: z.number(), // point_y in backend  
  ordre: z.number(),
});

export const SerreBackendSchema = z.object({
  id: z.number(),
  nom: z.string(),
  id_domaine: z.number(),
  position: z.array(PointGpsSchema),
  domaine: z.object({
    id: z.number(),
    nom: z.string(),
  }).optional(),
});

export type SerreBackend = z.infer<typeof SerreBackendSchema>;
export type PointGps = z.infer<typeof PointGpsSchema>;

class SerreBackendService {
  private baseUrl = '/api';

  async getAllSerres(): Promise<SerreBackend[]> {
    const response = await fetch(`${this.baseUrl}/serre`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des serres: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getSerre(id: number): Promise<SerreBackend> {
    const response = await fetch(`${this.baseUrl}/serre/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la serre: ${response.statusText}`);
    }

    const data = await response.json();
    return SerreBackendSchema.parse(data);
  }

  // Format serre name with domain for display
  formatSerreDisplay(serre: SerreBackend): string {
    if (serre.domaine) {
      return `${serre.nom} / ${serre.domaine.nom}`;
    }
    return serre.nom;
  }
}

export const serreBackendService = new SerreBackendService();
