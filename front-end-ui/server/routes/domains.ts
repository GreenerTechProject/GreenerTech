import { RequestHandler } from "express";

export interface CreateDomainRequest {
  name: string;
  area: number;
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  companyId: string;
}

export interface CreateDomainResponse {
  success: boolean;
  message: string;
  domainId: string;
}

export interface Domain {
  id: string;
  name: string;
  area: number;
  center: { lat: number; lng: number };
  path: { lat: number; lng: number }[];
  companyId: string;
}

// Create domain endpoint
export const handleCreateDomain: RequestHandler = async (req, res) => {
  try {
    const { name, area, center, path, companyId } =
      req.body as CreateDomainRequest;

    // Validate required fields
    if (
      !name ||
      !area ||
      !center ||
      !path ||
      !Array.isArray(path) ||
      !companyId
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Validate center coordinates
    if (
      typeof center.lat !== "number" ||
      typeof center.lng !== "number" ||
      center.lat < -90 ||
      center.lat > 90 ||
      center.lng < -180 ||
      center.lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées du centre invalides",
      });
    }

    // Validate path coordinates
    const isValidPath = path.every(
      (point) =>
        typeof point.lat === "number" &&
        typeof point.lng === "number" &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180,
    );

    if (!isValidPath) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées du chemin invalides",
      });
    }

    // TODO: Check authorization token and verify user can create domains for this company
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Save domain to database
    // For now, we'll simulate creating a domain
    const domainId = `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("Création du domaine:", {
      userId,
      domainId,
      name,
      area,
      center,
      pathPoints: path.length,
      companyId,
    });

    const response: CreateDomainResponse = {
      success: true,
      message: "Domaine créé avec succès",
      domainId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création du domaine:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Get domains by company ID
export const handleGetDomainsByCompany: RequestHandler = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "ID de l'entreprise requis",
      });
    }

    // TODO: Check authorization token and verify user can access this company's domains
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Fetch domains from database
    // For now, we'll return mock data
    const domains: Domain[] = [];

    console.log("Récupération des domaines pour l'entreprise:", {
      userId,
      companyId,
      domainsFound: domains.length,
    });

    res.status(200).json({
      success: true,
      domains,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des domaines:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
