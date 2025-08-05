import { RequestHandler } from "express";
import { updateUserConnectionStatus } from "./auth";

export interface CompanySetupRequest {
  companyName: string;
  companyAddress: string;
  cie: string;
  legalStatus: string;
  companyEmail: string;
}

export interface Company {
  id: string;
  name: string;
  type: string;
  location: string;
  isActive: boolean;
}

// Mock companies database
export const mockCompanies: Company[] = [
  {
    id: "1",
    name: "AgriTech Solutions",
    type: "Agriculture Technology",
    location: "Casablanca, Maroc",
    isActive: true,
  },
  {
    id: "2",
    name: "Maroc Fruits Export",
    type: "Export Agricole",
    location: "Agadir, Maroc",
    isActive: true,
  },
  {
    id: "3",
    name: "Bio Légumes du Nord",
    type: "Agriculture Biologique",
    location: "Meknès, Maroc",
    isActive: true,
  },
  {
    id: "4",
    name: "Serre Moderne Atlas",
    type: "Serres et Tunnels",
    location: "Béni Mellal, Maroc",
    isActive: true,
  },
  {
    id: "5",
    name: "Green Valley Farm",
    type: "Agriculture Durable",
    location: "El Jadida, Maroc",
    isActive: true,
  },
  {
    id: "6",
    name: "Olives du Rif",
    type: "Oléiculture",
    location: "Chefchaouen, Maroc",
    isActive: true,
  },
  {
    id: "7",
    name: "Fertil Maroc",
    type: "Fertilisants et Engrais",
    location: "Rabat, Maroc",
    isActive: true,
  },
  {
    id: "8",
    name: "Irrigation Plus",
    type: "Systèmes d'Irrigation",
    location: "Fès, Maroc",
    isActive: true,
  },
];

interface Domain {
  id: string;
  name: string;
  area: number;
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  serres: Serre[];
}

interface Serre {
  id: string;
  name: string;
  variety: string;
  yield: number;
  area: number;
  domainId: string;
  path: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  additionalData?: {
    plantingDate?: string;
    harvestDate?: string;
    irrigationType?: string;
    notes?: string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  birthday: string;
  telephone: string;
  cin: string;
  email: string;
  password: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
}

export interface CompletedSetupRequest {
  companyInfo: CompanySetupRequest;
  domains: Domain[];
  technicians: Technician[];
}

export interface CompanySetupResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    is_connected: boolean;
  };
}

// Company setup endpoint for directeur role
export const handleCompanySetup: RequestHandler = async (req, res) => {
  try {
    const { companyName, companyAddress, cie, legalStatus, companyEmail } =
      req.body as CompanySetupRequest;

    // Validate required fields
    if (
      !companyName ||
      !companyAddress ||
      !cie ||
      !legalStatus ||
      !companyEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Get user from request (assuming auth middleware sets this)
    // For now, we'll simulate getting user data
    // In a real implementation, you would get this from the authenticated user
    const userId = "user-123"; // This would come from auth middleware

    // Simulate saving company information to database
    console.log("Saving company information:", {
      userId,
      companyName,
      companyAddress,
      cie,
      legalStatus,
      companyEmail,
    });

    // Update user's is_connected status to true
    const updatedUser = updateUserConnectionStatus(userId, true);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Return success response with updated user data
   const response: CompanySetupResponse = {
  success: true,
  message: "Informations de l'entreprise enregistrées avec succès",
  user: updatedUser as CompanySetupResponse["user"],
};

    res.status(200).json(response);
  } catch (error) {
    console.error("Company setup error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Complete setup endpoint for company, domains, and serres
export const handleCompleteSetup: RequestHandler = async (req, res) => {
  try {
    const { companyInfo, domains, technicians } =
      req.body as CompletedSetupRequest;

    // Validate required fields
    if (
      !companyInfo ||
      !domains ||
      !Array.isArray(domains) ||
      !technicians ||
      !Array.isArray(technicians)
    ) {
      return res.status(400).json({
        success: false,
        message: "Données de configuration incomplètes",
      });
    }

    // Validate company info
    const { companyName, companyAddress, cie, legalStatus, companyEmail } =
      companyInfo;
    if (
      !companyName ||
      !companyAddress ||
      !cie ||
      !legalStatus ||
      !companyEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Informations de l'entreprise incomplètes",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Get user from request (assuming auth middleware sets this)
    const userId = "1"; // This would come from auth middleware

    // Calculate statistics
    const totalDomains = domains.length;
    const totalSerres = domains.reduce(
      (total, domain) => total + domain.serres.length,
      0,
    );
    const totalTechnicians = technicians.length;
    const totalDomainArea = domains.reduce(
      (total, domain) => total + domain.area,
      0,
    );
    const totalSerreArea = domains.reduce(
      (total, domain) =>
        total +
        domain.serres.reduce((serreTotal, serre) => serreTotal + serre.area, 0),
      0,
    );
    const assignedSerres = technicians.reduce(
      (total, tech) => total + tech.assignedSerres.length,
      0,
    );
    const technicienSuperieurCount = technicians.filter(
      (t) => t.role === "technicien_superieur",
    ).length;

    // Simulate saving complete setup to database
    console.log("Saving complete company setup:", {
      userId,
      companyInfo,
      statistics: {
        totalDomains,
        totalSerres,
        totalTechnicians,
        totalDomainArea: Math.round(totalDomainArea),
        totalSerreArea: Math.round(totalSerreArea),
        assignedSerres,
        technicienSuperieurCount,
      },
      domains: domains.map((domain) => ({
        ...domain,
        serresCount: domain.serres.length,
        varieties: [...new Set(domain.serres.map((s) => s.variety))],
      })),
      technicians: technicians.map((tech) => ({
        ...tech,
        password: "[REDACTED]", // Don't log passwords
        assignedSerresCount: tech.assignedSerres.length,
      })),
    });

    // For demo purposes, simulate a successful database operation
    // In a real implementation, you would:
    // 1. Save company information to the company table
    // 2. Save domains with their geometries
    // 3. Save serres with their crop data
    // 4. Update user's is_connected status to true
    // 5. Link everything together with proper foreign keys

    // Update user's is_connected status to true
    const updatedUser = updateUserConnectionStatus(userId, true);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Return success response with updated user data
    const response: CompanySetupResponse = {
      success: true,
      message: `Configuration terminée ! ${totalDomains} domaine(s), ${totalSerres} serre(s) et ${totalTechnicians} technicien(s) configurés avec succès.`,
      user: updatedUser as CompanySetupResponse["user"],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Complete setup error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Get companies list endpoint
export const handleGetCompanies: RequestHandler = async (req, res) => {
  try {
    // Filter only active companies
    const activeCompanies = mockCompanies.filter((company) => company.isActive);

    console.log("Fetching companies list:", activeCompanies.length);

    res.status(200).json({
      success: true,
      companies: activeCompanies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des entreprises",
    });
  }
};
