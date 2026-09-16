"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  StoredUser,
  getStoredUser,
  getAuthToken,
  authAPI,
  removeAuthToken,
} from "@/lib/api";

interface AuthContextType {
  user: StoredUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<StoredUser>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = () => {
    const storedUser = getStoredUser();
    const storedToken = getAuthToken();
    setUser(storedUser);
    setToken(storedToken);
  };

  useEffect(() => {
    refreshUser();
    setIsLoading(false);

    const handleUserUpdate = () => {
      refreshUser();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pharmalink_user_updated", handleUserUpdate);
      window.addEventListener("storage", handleUserUpdate);
      return () => {
        window.removeEventListener("pharmalink_user_updated", handleUserUpdate);
        window.removeEventListener("storage", handleUserUpdate);
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<StoredUser> => {
    const data = await authAPI.login(email, password);
    const loggedUser: StoredUser = {
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      kyc_status: data.kyc_status,
    };
    setUser(loggedUser);
    setToken(data.access_token);
    return loggedUser;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
