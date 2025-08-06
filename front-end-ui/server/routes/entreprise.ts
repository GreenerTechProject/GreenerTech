import { RequestHandler } from "express";

export interface CreateEntrepriseRequest {
  companyName: string;
  companyAddress: string;
  cie: string;
  legalStatus: string;
  companyEmail: string;
}

export interface CreateEntrepriseResponse {
  success: boolean;
  message: string;
  companyId: string;
}

// Create company endpoint
export const handleCreateEntreprise: RequestHandler = async (req, res) => {
  try {
    const { companyName, companyAddress, cie, legalStatus, companyEmail } =
      req.body as CreateEntrepriseRequest;

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

    // TODO: Check authorization token and get user ID
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Save company to database
    // For now, we'll simulate creating a company
    const companyId = `company-${Date.now()}`;

    console.log("Création de l'entreprise:", {
      userId,
      companyId,
      companyName,
      companyAddress,
      cie,
      legalStatus,
      companyEmail,
    });

    const response: CreateEntrepriseResponse = {
      success: true,
      message: "Entreprise créée avec succès",
      companyId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
