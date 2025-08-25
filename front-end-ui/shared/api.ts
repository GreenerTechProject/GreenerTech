/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Culture Guide Interface - Guide de Culture
 */
export interface GuideDeCulture {
  id: string;
  nom: string; // nom du guide
  rendement: number; // rendement en kg/m²
  variete: string; // variété de culture
  date_debut_saison: string; // date de début de saison
  date_fin_saison: string; // date de fin de saison
  nombre_de_plants: number; // nombre de plants
  id_serre: string; // foreign key linking to Serre
  irrigationType?: string; // type d'irrigation
  notes?: string; // notes additionnelles
}

/**
 * Serre Interface - updated to use culture guide reference
 */
export interface Serre {
  id: string;
  nom: string;
  surface: number;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guideId: string; // foreign key linking to GuideDeCulture
  domainId: string;
}

/**
 * Extended Serre Interface with guide information included
 */
export interface ExtendedSerre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  guideId?: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guideData?: ExtendedGuideDeCulture;
}

export interface ExtendedGuideDeCulture extends Omit<GuideDeCulture, "date_debut_saison" | "date_fin_saison"> {
  date_debut_saison: Date | string;
  date_fin_saison: Date | string;
}

/**
 * Billon Interface - Agricultural bed/furrow for regular technicians
 */
export interface Billon {
  id: string;
  name: string;
  serreId: string; // foreign key linking to Serre
  technicienId: string; // assigned technician
  variety: string; // crop variety grown in this billon
  area: number; // area in m²
  status: "planted" | "growing" | "ready" | "harvested" | "maintenance";
  plantingDate?: string;
  expectedHarvestDate?: string;
  notes?: string;
  // Location within the serre (could be coordinates or zone reference)
  position?: {
    row: number;
    section: string;
  };
}
