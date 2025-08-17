import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  authService,
  User,
  LoginRequest,
  RegisterRequest,
  ApiError,
} from "../services/authService";
import {
  registrationService,
  UnifiedRegistrationData,
  RegistrationResult,
} from "../services/registrationService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  unifiedRegister: (
    userData: UnifiedRegistrationData,
  ) => Promise<RegistrationResult>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize theme on app load
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = storedTheme ? storedTheme === 'dark' : prefersDark;
    
    document.documentElement.classList.toggle('dark', initialDark);
    document.body.classList.toggle('dark', initialDark);
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Check if user data exists in localStorage
        const storedUser = authService.getStoredUser();

        if (storedUser && authService.isAuthenticated()) {
          // Try to get fresh user data from server
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // If server request fails, use stored user data
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Clear invalid auth data
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      console.log(response);
      setUser(response.user);
    } catch (error) {
      const apiError = error as ApiError;
      console.log("AuthContext received error:", apiError);
      console.log("Error message:", apiError.message);
      console.log("Error status:", apiError.status);
      setError(apiError.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(userData);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unifiedRegister = async (
    userData: UnifiedRegistrationData,
  ): Promise<RegistrationResult> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate data first
      const validation = registrationService.validateRegistrationData(userData);
      if (!validation.isValid) {
        throw {
          message: validation.errors[0],
          status: 400,
        };
      }

      const result = await registrationService.register(userData);

      // If it's a successful registration (not affiliation), set the user
      // if (result.type === "registration") {
      //   setUser(result.data.user);
      // }

      return result;
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Clear user state immediately to prevent role-based redirects
      setUser(null);
      setError(null);
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if server logout fails
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
      // Redirect to login page after logout
      window.location.href = "/login";
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    authService.setUser(updatedUser);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    unifiedRegister,
    logout,
    updateUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
