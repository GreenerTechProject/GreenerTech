import {
  authService,
  RegisterRequest,
  AffiliationRequest,
  AuthResponse,
  AffiliationResponse,
} from "./authService";

export interface UnifiedRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  cin?: string;
  companyName?: string;
  birthDate?: string;
  role: string;
}

export type RegistrationResult =
  | {
      type: "registration";
      data: AuthResponse;
    }
  | {
      type: "affiliation";
      data: AffiliationResponse;
    };

export const registrationService = {
  // Unified registration function that handles both types
  register: async (
    userData: UnifiedRegistrationData,
  ): Promise<RegistrationResult> => {
    const { role } = userData;

    // For Directeur role, use regular registration
    if (role === "directeur") {
      const registerData: RegisterRequest = {
        email: userData.email,
        password: userData.password,
        name:`${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        role: userData.role,
      };

      const result = await authService.register(registerData);
      return {
        type: "registration",
        message: result.message,
      };
    }

    // For Technicien Supérieur and Technicien roles, use affiliation request
    if (role === "technicien-superieur" || role === "technicien") {
      if (
        !userData.firstName ||
        !userData.lastName ||
        !userData.companyName ||
        !userData.birthDate
      ) {
        throw {
          message: "All fields are required for affiliation request",
          status: 400,
        };
      }

      const affiliationData: AffiliationRequest = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        telephone: userData.telephone || "",
        cin: userData.cin || "",
        companyName: userData.companyName,
        birthDate: userData.birthDate,
        role: userData.role,
      };

      const result =
        await authService.submitAffiliationRequest(affiliationData);
      return {
        type: "affiliation",
        data: result,
      };
    }

    throw {
      message: "Invalid role specified",
      status: 400,
    };
  },

  // Check if registration type requires affiliation
  requiresAffiliation: (role: string): boolean => {
    return role === "technicien-superieur" || role === "technicien";
  },

  // Get required fields for each role type
  getRequiredFields: (role: string): string[] => {
    if (role === "directeur") {
      return ["email", "password", "lastName", "firstName"];
    }

    if (role === "technicien-superieur" || role === "technicien") {
      return [
        "email",
        "password",
        "firstName",
        "lastName",
        "telephone",
        "cin",
        "companyName",
        "birthDate",
      ];
    }

    return [];
  },

  // Validate registration data
  validateRegistrationData: (
    userData: UnifiedRegistrationData,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = registrationService.getRequiredFields(userData.role);

    // Check required fields
    requiredFields.forEach((field) => {
      const value = userData[field as keyof UnifiedRegistrationData];
      if (!value || (typeof value === "string" && !value.trim())) {
        errors.push(`${field} is required`);
      }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    if (userData.password && userData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Birth date validation for affiliation requests
    if (
      registrationService.requiresAffiliation(userData.role) &&
      userData.birthDate
    ) {
      const birthDate = new Date(userData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 18) {
        errors.push("You must be at least 18 years old");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default registrationService;
