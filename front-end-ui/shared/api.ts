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
  variety: string; // variété
  yield: number; // rendement
  plantingDate: string; // date de début de saison
  harvestDate: string; // date de fin de saison
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
  guideId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: ExtendedGuideDeCulture;
}

export interface ExtendedGuideDeCulture extends Omit<GuideDeCulture, "plantingDate" | "harvestDate"> {
  plantingDate: Date | string;
  harvestDate: Date | string;
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
