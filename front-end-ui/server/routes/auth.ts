import { RequestHandler } from "express";

// Types for authentication
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  setup_completed?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface AffiliationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  telephone: string;
  cin: string;
  companyName: string;
  birthDate: string;
  role: string;
}

export interface AffiliationResponse {
  message: string;
  requestId: string;
  status: "pending" | "approved" | "rejected";
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Mock pre-registered techniciens (created by directors)
export const mockPreRegisteredTechniciens: (User & { preRegistered: true })[] =
  [
    {
      id: "pre_1",
      email: "technicien.pre@example.com",
      name: "Jean Dupont",
      role: "technicien",
      setup_completed: false,
      preRegistered: true,
    },
    {
      id: "pre_2",
      email: "techsup.pre@example.com",
      name: "Marie Martin",
      role: "technicien_superieur",
      setup_completed: false,
      preRegistered: true,
    },
  ];

// Mock user database for demo purposes
export const mockUsers: User[] = [
  {
    id: "1",
    email: "directeur@example.com",
    name: "Directeur Test",
    role: "directeur",
    setup_completed: false, // Will be set to true after company setup
  },
  {
    id: "2",
    email: "technicien@example.com",
    name: "Technicien Test",
    role: "technicien",
    setup_completed: true,
  },
];

// Mock affiliation requests storage
export const mockAffiliationRequests: (AffiliationRequest & {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
})[] = [];

// Function to update user's setup_completed status
export const updateUserConnectionStatus = (
  userId: string,
  isConnected: boolean,
): User | null => {
  const userIndex = mockUsers.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    mockUsers[userIndex].setup_completed = isConnected;
    return mockUsers[userIndex];
  }
  return null;
};

// Login endpoint
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Find user in mock database
    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // For demo purposes, accept any password
    // In a real implementation, you would hash and compare passwords

    // Generate a mock JWT token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    const response: AuthResponse = {
      user,
      token,
    };

    console.log("Login successful:", {
      email,
      role: user.role,
      setup_completed: user.setup_completed,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Register endpoint
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, role } = req.body as RegisterRequest;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Create new user
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      email,
      name,
      role: role || "directeur", // Default to directeur
      setup_completed: false, // Will be set to true after setup
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate a mock JWT token
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    const response: AuthResponse = {
      user: newUser,
      token,
    };

    console.log("Registration successful:", { email, role: newUser.role });

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Technician affiliation request endpoint
export const handleTechnicianAffiliation: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      telephone,
      cin,
      companyName,
      birthDate,
      role,
    } = req.body as AffiliationRequest;

    // Validate required fields
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !telephone ||
      !cin ||
      !companyName ||
      !birthDate ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Validate telephone and CIN length
    if (telephone.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone doit contenir au moins 8 chiffres",
      });
    }

    if (cin.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le CIN doit contenir au moins 8 caractères",
      });
    }

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    const existingRequest = mockAffiliationRequests.find(
      (r) => r.email === email,
    );

    if (existingUser || existingRequest) {
      return res.status(409).json({
        success: false,
        message: "Un utilisateur ou une demande avec cet email existe déjà",
      });
    }

    // Create affiliation request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const affiliationRequest = {
      id: requestId,
      email,
      password, // In production, this should be hashed
      firstName,
      lastName,
      telephone,
      cin,
      companyName,
      birthDate,
      role,
      status: "pending" as const,
      createdAt: new Date(),
    };

    mockAffiliationRequests.push(affiliationRequest);

    const response: AffiliationResponse = {
      message: "Demande d'affiliation soumise avec succès",
      requestId,
      status: "pending",
    };

    console.log("Affiliation request created:", { email, role, requestId });

    res.status(201).json(response);
  } catch (error) {
    console.error("Affiliation request error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Check if technicien is pre-registered endpoint
export const handleTechnicienCheck: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    // Check if user is pre-registered
    const preRegisteredUser = mockPreRegisteredTechniciens.find(
      (u) => u.email === email,
    );

    if (preRegisteredUser) {
      return res.status(200).json({
        success: true,
        preRegistered: true,
        user: {
          id: preRegisteredUser.id,
          name: preRegisteredUser.name,
          email: preRegisteredUser.email,
          role: preRegisteredUser.role,
        },
      });
    }

    // User not pre-registered
    return res.status(200).json({
      success: true,
      preRegistered: false,
    });
  } catch (error) {
    console.error("Technicien check error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Complete technicien registration endpoint
export const handleTechnicienCompleteRegistration: RequestHandler = async (
  req,
  res,
) => {
  try {
    const {
      email,
      password,
      telephone,
      cin,
      birthDate,
      // For non-pre-registered users
      firstName,
      lastName,
      role,
      companyName,
    } = req.body;

    // Validate required fields
    if (!email || !password || !telephone || !cin || !birthDate) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires sont requis",
      });
    }

    // Check if user is pre-registered
    const preRegisteredUser = mockPreRegisteredTechniciens.find(
      (u) => u.email === email,
    );

    if (preRegisteredUser) {
      // Complete registration for pre-registered user
      const newUser: User = {
        id: preRegisteredUser.id,
        email: preRegisteredUser.email,
        name: preRegisteredUser.name,
        role: preRegisteredUser.role,
        setup_completed: true,
      };

      // Add to main users array
      mockUsers.push(newUser);

      // Remove from pre-registered
      const index = mockPreRegisteredTechniciens.indexOf(preRegisteredUser);
      if (index > -1) {
        mockPreRegisteredTechniciens.splice(index, 1);
      }

      return res.status(200).json({
        success: true,
        message: "Inscription complétée avec succès",
        user: newUser,
      });
    } else {
      // Handle non-pre-registered user (create affiliation request)
      if (!firstName || !lastName || !role || !companyName) {
        return res.status(400).json({
          success: false,
          message:
            "Informations complètes requises pour les nouveaux utilisateurs",
        });
      }

      return handleTechnicianAffiliation(req, res);
    }
  } catch (error) {
    console.error("Complete registration error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Logout user endpoint
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Extract the JWT token from Authorization header
    // 2. Add the token to a blacklist/invalidate it
    // 3. Clear any server-side session data

    // For demo purposes, we'll just return success
    console.log("User logged out successfully");

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
    });
  }
};

// Get current user endpoint
export const handleGetCurrentUser: RequestHandler = async (req, res) => {
  try {
    // In a real implementation, you would extract user from JWT token
    // For demo purposes, we'll return the first directeur user
    const user = mockUsers.find((u) => u.role === "directeur");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
