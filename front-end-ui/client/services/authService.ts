import axios from "axios";

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
  id_entreprise: string;
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

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    api.put('/user', user);
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
        authService.logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export const authService = {
  setUser(user: any) {
    tokenManager.setUser(user);
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      const { user, token } = response.data;

      tokenManager.setToken(token);
      tokenManager.setUser(user);

      return response.data;
    } catch (error: any) {
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

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      const { message } = response.data;

      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Registration failed",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  submitAffiliationRequest: async (
    affiliationData: AffiliationRequest
  ): Promise<AffiliationResponse> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/affiliation/request`,
        affiliationData
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Affiliation request failed",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  checkAffiliationStatus: async (
    requestId: string
  ): Promise<AffiliationResponse> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/affiliation/status/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to check affiliation status",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const token = tokenManager.getToken();
      if (token) {
        await api.post("/logout");
      }
    } catch (error: any) {
      // Logout API call failed, but continue with local cleanup
    } finally {
      tokenManager.clearAll();
      // Don't redirect here - let the component handle routing
      // window.location.href = "/login"; // ← REMOVED THIS LINE
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const user = await api.get("/user");
      return user.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to get current user",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put("/user", profileData);
      const updatedUser = response.data;
      
      const currentUser = tokenManager.getUser();
      const mergedUser = { ...currentUser, ...updatedUser };
      tokenManager.setUser(mergedUser);
      
      return mergedUser;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update profile",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  deleteUser: async (): Promise<void> => {
    try {
      await api.delete("/user");
      tokenManager.clearAll();
      // Don't redirect here - let the component handle routing
      // window.location.href = "/login"; // ← REMOVED THIS LINE
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete user",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { token } = response.data;
      tokenManager.setToken(token);

      return { token };
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Token refresh failed",
        status: error.response?.status || 500,
      } as ApiError;
    }
  },
};

export default authService;
