import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
  loginApi,
  registerApi,
  getProfileApi,
  logoutApi,
} from '@/services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (payload: { name: string; email: string; password: string; department?: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  quickLoginAsRole: (role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify profile on initial mount if token exists
  useEffect(() => {
    async function verifySession() {
      const savedToken = getStoredToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      const res = await getProfileApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setStoredUser(res.data.user);
      } else {
        // If server reports invalid/expired token, clear
        if (res.error?.code === 'TOKEN_EXPIRED' || res.error?.code === 'TOKEN_INVALID') {
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await loginApi(email, password);
    setIsLoading(false);

    if (res.success && res.data?.user && res.data?.token) {
      setUser(res.data.user);
      setToken(res.data.token);
      return { success: true, message: res.message, user: res.data.user };
    }

    return {
      success: false,
      message: res.message || 'Invalid institutional email or password.',
    };
  };

  const register = async (payload: { name: string; email: string; password: string; department?: string }) => {
    setIsLoading(true);
    const res = await registerApi(payload);
    setIsLoading(false);

    if (res.success && res.data?.user && res.data?.token) {
      setUser(res.data.user);
      setToken(res.data.token);
      return { success: true, message: res.message, user: res.data.user };
    }

    return {
      success: false,
      message: res.message || 'Registration failed. Please check form inputs.',
    };
  };

  const logout = useCallback(() => {
    logoutApi();
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, []);

  // One-click quick login for testing with seeded role credentials
  const quickLoginAsRole = async (targetRole: UserRole): Promise<boolean> => {
    const creds: Record<string, { email: string; pass: string }> = {
      student: { email: 'student@scholars.shelf', pass: 'StudentPass123!' },
      librarian: { email: 'librarian@scholars.shelf', pass: 'LibrarianPass123!' },
      admin: { email: 'admin@scholars.shelf', pass: 'AdminPass123!' },
    };

    const targetCred = creds[targetRole];
    if (!targetCred) return false;

    const result = await login(targetCred.email, targetCred.pass);
    return result.success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        quickLoginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
