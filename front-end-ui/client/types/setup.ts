// Shared types for company setup process

export interface GuideData {
  id: string;
  variety: string;
  yield: number;
  plantingDate: Date | string;
  harvestDate: Date | string;
  irrigationType?: string;
  notes?: string;
}

export interface SerreSetup {
  id: string;
  name: string;
  area: number;
  domainId: string;
  guideId: string;
  path: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: GuideData;
}

export interface DomainSetup {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: any[]; // Using any[] to match CompanySetupWizard interface
}

export interface TechnicianSetup {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[]; // Serres assigned to this technician (for Technicien Sup)
  id_assigned?: string | null; // ID of supervisor this technician reports to (for regular technicians)
}

export interface CompanyInfoSetup {
  nom: string;
  adresse: string;
  cie: string;
  status_juridique: string;
  email: string;
}

export interface SerreAssignment {
  serreId: string;
  supervisorIds: string[]; // Array of Technicien Sup IDs assigned to this serre
}

export interface CompletedSetupData {
  companyInfo: CompanyInfoSetup;
  domains: DomainSetup[];
  technicians: TechnicianSetup[];
  serreAssignments: SerreAssignment[];
}
