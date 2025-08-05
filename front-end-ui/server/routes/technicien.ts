import { RequestHandler } from "express";

export interface CreateTechnicienRequest {
  fullName: string;
  birthday: string;
  telephone: string;
  cin: string;
  email: string;
  password: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
  companyId: string;
}

export interface CreateTechnicienResponse {
  success: boolean;
  message: string;
  technicianId: string;
}

export interface Technician {
  id: string;
  fullName: string;
  birthday: string;
  telephone: string;
  cin: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
  companyId: string;
}

// Create technician endpoint
export const handleCreateTechnicien: RequestHandler = async (req, res) => {
  try {
    const {
      fullName,
      birthday,
      telephone,
      cin,
      email,
      password,
      role,
      assignedSerres,
      companyId,
    } = req.body as CreateTechnicienRequest;

    // Validate required fields
    if (
      !fullName ||
      !birthday ||
      !telephone ||
      !cin ||
      !email ||
      !password ||
      !role ||
      !Array.isArray(assignedSerres) ||
      !companyId
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Validate role
    if (role !== "technicien_superieur" && role !== "technicien") {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide",
      });
    }

    // Validate birthday format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
      return res.status(400).json({
        success: false,
        message: "Format de date de naissance invalide (YYYY-MM-DD requis)",
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    if (!phoneRegex.test(telephone)) {
      return res.status(400).json({
        success: false,
        message: "Format de téléphone invalide",
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // TODO: Check authorization token and verify user can create technicians for this company
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Check if email already exists
    // TODO: Hash password before saving
    // TODO: Save technician to database
    // For now, we'll simulate creating a technician
    const technicianId = `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("Création du technicien:", {
      userId,
      technicianId,
      fullName,
      email,
      role,
      birthday,
      telephone,
      cin,
      assignedSerresCount: assignedSerres.length,
      companyId,
      // Ne pas logger le mot de passe
    });

    const response: CreateTechnicienResponse = {
      success: true,
      message: "Technicien créé avec succès",
      technicianId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création du technicien:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Get technicians by company ID
export const handleGetTechniciensByCompany: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "ID de l'entreprise requis",
      });
    }

    // TODO: Check authorization token and verify user can access this company's technicians
    const userId = "user-123"; // This would come from auth middleware

    // TODO: Fetch technicians from database (without passwords)
    // For now, we'll return mock data
    const technicians: Technician[] = [];

    console.log("Récupération des techniciens pour l'entreprise:", {
      userId,
      companyId,
      techniciansFound: technicians.length,
    });

    res.status(200).json({
      success: true,
      technicians,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des techniciens:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
