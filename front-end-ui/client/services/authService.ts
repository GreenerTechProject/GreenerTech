import axios from "axios";

// Types for authentication
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  setup_completed?: boolean;
  directeur_valide?: boolean;
  id_entreprise?: number;
  telephone?: string;
  birthday?: string;
  cin?: string;
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

export interface ApiError {
  message: string;
  status: number;
}

// Configure axios base URL - update this to match your backend
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  setUser: async(user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    await api.put('/user', user);
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  clearAll: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          tokenManager.setToken(token);

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authService.logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// Auth service functions
export const authService = {
  setUser(user: any) {
    tokenManager.setUser(user);
  },
  // Login user
 login: async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    const { user, token } = response.data;

    // // Check for unvalidated technician accounts
    // if ((user.role === "technicien" || user.role === "technicien_superieur") && !user.directeur_valide) {
    //   tokenManager.clearAll();
    //   console.log("this user is not validated by director");

    //   throw {
    //     message: "Votre compte n'a pas encore été validé par un directeur. Veuillez contacter votre directeur pour activer votre accès.",
    //     status: 403
    //   } as ApiError;
    // }

    tokenManager.setToken(token);
    tokenManager.setUser(user);

    return response.data;
  } catch (error: any) {
    // Normalize all Axios and manual errors
    const normalizedMessage =
      error?.message ||
      error?.response?.data?.message ||
      "Login failed";

    const status =
      error?.status ||
      error?.response?.status ||
      500;

    throw {
      message: normalizedMessage,
      status,
    } as ApiError;
  }
},


  // Register user (for Directeur role)
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      console.log(userData);
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      const { message } = response.data;

      console.log(response);

      //tokenManager.setToken(token);
      // tokenManager.setUser(user);

      // if (refreshToken) {
      //   tokenManager.setRefreshToken(refreshToken);
      // }

      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Registration failed",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Submit affiliation request (for Technicien Supérieur and Technicien roles)
  submitAffiliationRequest: async (
    affiliationData: AffiliationRequest,
  ): Promise<AffiliationResponse> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/technicien/register`,
        affiliationData,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Affiliation request failed",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Check affiliation request status
  checkAffiliationStatus: async (
    requestId: string,
  ): Promise<AffiliationResponse> => {
    try {
      const response = await api.get(`/auth/affiliation-request/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to check affiliation status",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Get all affiliation requests (for admin users)
  getAffiliationRequests: async (): Promise<AffiliationResponse[]> => {
    try {
      const response = await api.get("/auth/affiliation-requests");
      return response.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to get affiliation requests",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Approve or reject affiliation request (for admin users)
  updateAffiliationRequest: async (
    requestId: string,
    status: "approved" | "rejected",
    adminNotes?: string,
  ): Promise<AffiliationResponse> => {
    try {
      const response = await api.patch(
        `/auth/affiliation-request/${requestId}`,
        {
          status,
          adminNotes,
        },
      );
      return response.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          "Failed to update affiliation request",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      const token = tokenManager.getToken();
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      tokenManager.clearAll();
    }
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get(`${API_BASE_URL}/user`);
      const user = response.data;
      tokenManager.setUser(user);
      return user;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to get user data",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Change password
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to change password",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to request password reset",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to reset password",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = tokenManager.getToken();
    const user = tokenManager.getUser();
    return !!(token && user);
  },

  // Get stored user data
  getStoredUser: (): User | null => {
    return tokenManager.getUser();
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User & {
    telephone?: string;
    birthday?: string;
    password?: string;
  }>): Promise<User> => {
    try {
      const response = await api.put("/user", profileData);
      const updatedUser = response.data.user || response.data;

      // Update local storage with new user data
      const currentUser = tokenManager.getUser();
      if (currentUser) {
        const mergedUser = { ...currentUser, ...profileData };
        delete mergedUser.password; // Don't store password locally
        tokenManager.setUser(mergedUser);
      }

      return updatedUser;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update profile",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default authService;
