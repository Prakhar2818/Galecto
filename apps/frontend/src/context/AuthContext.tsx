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
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const sessionTimeoutMinutes = 30; // Configurable

  const clearSessionTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const resetSessionTimer = useCallback(() => {
    if (!isAuthenticated) return;
    clearSessionTimers();
    
    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 2 * 60 * 1000; // Warning 2 minutes before
    
    warningTimeoutRef.current = setTimeout(() => {
      setShowSessionWarning(true);
    }, warningMs);
    
    sessionTimeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [isAuthenticated, clearSessionTimers]);

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

  useEffect(() => {
    if (isAuthenticated) {
      resetSessionTimer();
      
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetSessionTimer();
      
      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      
      return () => {
        clearSessionTimers();
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [isAuthenticated, resetSessionTimer, clearSessionTimers]);

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
        await apiFetch('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
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
      {showSessionWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Session Expiring Soon</h3>
              <p className="text-sm text-slate-500">Your session will expire in 2 minutes due to inactivity. Click below to stay logged in.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSessionWarning(false);
                  resetSessionTimer();
                }}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600"
              >
                Stay Logged In
              </button>
              <button
                onClick={() => {
                  setShowSessionWarning(false);
                  logout();
                }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
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