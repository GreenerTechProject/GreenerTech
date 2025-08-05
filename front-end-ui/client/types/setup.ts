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
  serres: SerreSetup[];
}

export interface TechnicianSetup {
  id: string;
  fullName: string;
  birthday: Date;
  telephone: string;
  cin: string;
  email: string;
  password: string;
  role: "technicien supérieur" | "technicien";
  assignedSerres: string[];
}

export interface CompanyInfoSetup {
  nom: string;
  adresse: string;
  cie: string;
  status_juridique: string;
  email: string;
}

export interface CompletedSetupData {
  companyInfo: CompanyInfoSetup;
  domains: DomainSetup[];
  technicians: TechnicianSetup[];
}
