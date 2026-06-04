"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  organizationId: string;
  organizationName?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;
const STORAGE_KEY_TOKEN = 'ag_token';
const STORAGE_KEY_USER = 'ag_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          if (parsedUser.id && parsedUser.email && parsedUser.organizationId) {
            setToken(savedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_USER);
          }
        }
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshIntervalRef.current = setInterval(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, token]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3001'}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.user) {
          localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          return true;
        }
      }

      await logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return false;
    }
  }, [token]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
      }
    } finally {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [token, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshToken,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}