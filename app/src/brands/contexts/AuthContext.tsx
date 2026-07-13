import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "adspot_brand_token";

// Set the token getter immediately at module load — NOT inside a useEffect.
// If this is inside a useEffect it runs after the first render, but useGetMe
// fires during that same render (when a stored token exists), sending requests
// with no auth header → 401 → logout() wipes the valid session.
// token getter set centrally in main.tsx (path-aware) to avoid cross-section conflict

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    window.location.href = "/brands/login";
  };

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: !!token && isUserLoading, login, logout }}>
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
