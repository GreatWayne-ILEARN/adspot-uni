import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, LoginRequest } from "@workspace/api-client-react";
import { login as apiLogin, getMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";

// token getter set centrally in main.tsx (path-aware) to avoid cross-section conflict

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adspot_token');
      if (token) {
        try {
          const profile = await getMe();
          setUser(profile);
        } catch (error) {
          localStorage.removeItem('adspot_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await apiLogin(data);
    if (res.user.role !== 'reviewer') {
      // Brands and admins belong in the Brand Portal, not the reviewer platform
      throw new Error('WRONG_PORTAL');
    }
    localStorage.setItem('adspot_token', res.token);
    setUser(res.user);
    setLocation('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('adspot_token');
    setUser(null);
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
