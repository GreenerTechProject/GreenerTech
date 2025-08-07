import { RequestHandler } from "express";
import { Serre, GuideDeCulture } from "@shared/api";

export interface CreateGuideDeCultureRequest {
  variety: string;
  yield: number;
  plantingDate: string;
  harvestDate: string;
  irrigationType?: string;
  notes?: string;
}

export interface CreateGuideDeCultureResponse {
  success: boolean;
  message: string;
  guideId: string;
}

export interface CreateSerreRequest {
  nom: string;
  surface: number;
  domainId: string;
  guideId: string;
  position: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
}

export interface CreateSerreResponse {
  success: boolean;
  message: string;
  serreId: string;
}

// Create culture guide endpoint
export const handleCreateGuideDeCulture: RequestHandler = async (req, res) => {
  try {
    const {
      variety,
      yield: guideYield,
      plantingDate,
      harvestDate,
      irrigationType,
      notes,
    } = req.body as CreateGuideDeCultureRequest;

    // Validate required fields
    if (
      !variety ||
      typeof guideYield !== "number" ||
      !plantingDate ||
      !harvestDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tous les champs requis doivent être fournis (variété, rendement, dates)",
      });
    }

    // Validate yield is positive
    if (guideYield < 0) {
      return res.status(400).json({
        success: false,
        message: "Le rendement doit être un nombre positif",
      });
    }

    // TODO: Check authorization token
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Save guide to database
    const guideId = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("Création du guide de culture:", {
      userId,
      guideId,
      variety,
      yield: guideYield,
      plantingDate,
      harvestDate,
      irrigationType,
      notes,
    });

    const response: CreateGuideDeCultureResponse = {
      success: true,
      message: "Guide de culture créé avec succès",
      guideId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création du guide de culture:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Create serre endpoint
export const handleCreateSerre: RequestHandler = async (req, res) => {
  try {
    const { nom, surface, domainId, guideId, position, center } =
      req.body as CreateSerreRequest;

    // Validate required fields
    if (
      !nom ||
      !surface ||
      !domainId ||
      !guideId ||
      !position ||
      !Array.isArray(position) ||
      !center
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis",
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

    // Validate position coordinates
    const isValidPosition = position.every(
      (point) =>
        typeof point.lat === "number" &&
        typeof point.lng === "number" &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180,
    );

    if (!isValidPosition) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées du chemin invalides",
      });
    }

    // Validate surface is positive
    if (surface <= 0) {
      return res.status(400).json({
        success: false,
        message: "La superficie doit être un nombre positif",
      });
    }

    // TODO: Check authorization token and verify user can create serres for this domain
    // TODO: Verify that guideId exists and belongs to user
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Save serre to database
    const serreId = `serre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("Création de la serre:", {
      userId,
      serreId,
      nom,
      surface,
      domainId,
      guideId,
      positionPoints: position.length,
      center,
    });

    const response: CreateSerreResponse = {
      success: true,
      message: "Serre créée avec succès",
      serreId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création de la serre:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Get guides de culture by user
export const handleGetGuidesDeCulture: RequestHandler = async (req, res) => {
  try {
    // TODO: Check authorization token
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Fetch guides from database
    // For now, we'll return mock data
    const guides: GuideDeCulture[] = [];

    console.log("Récupération des guides de culture:", {
      userId,
      guidesFound: guides.length,
    });

    res.status(200).json({
      success: true,
      guides,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des guides de culture:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Get serres by domain ID
export const handleGetSerresByDomain: RequestHandler = async (req, res) => {
  try {
    const { domainId } = req.params;

    if (!domainId) {
      return res.status(400).json({
        success: false,
        message: "ID du domaine requis",
      });
    }

    // TODO: Check authorization token and verify user can access this domain's serres
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Fetch serres from database with associated guides
    // For now, we'll return mock data
    const serres: Serre[] = [];

    console.log("Récupération des serres pour le domaine:", {
      userId,
      domainId,
      serresFound: serres.length,
    });

    res.status(200).json({
      success: true,
      serres,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des serres:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
