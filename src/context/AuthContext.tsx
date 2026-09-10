/**
 * Let's Estimate - Authentication & User Context
 * Manages user session state, local persistence, profile updates, and auth modal triggers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserStats } from '../types';
import { safeFetchJson } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  stats: UserStats | null;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot';
  isProfileModalOpen: boolean;
  openAuthModal: (view?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  loginWithGoogle: (email: string, name: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lets_estimate_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const { ok, data } = await safeFetchJson<{ success: boolean; user: User; stats: UserStats; error?: string }>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (ok && data?.user) {
        setUser(data.user);
        setStats(data.stats);
      } else {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      // Gracefully handle token verification failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      // If no token, check if we should auto-connect to the seeded demo lead QS
      setIsLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const saveAuthSession = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; error?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Invalid credentials' };
    }
    saveAuthSession(data.token, data.user);
    return { success: true };
  };

  const register = async (userData: any) => {
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; verificationCode?: string; error?: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Failed to create account' };
    }
    saveAuthSession(data.token, data.user);
    return { success: true, verificationCode: data.verificationCode };
  };

  const loginWithGoogle = async (email: string, name: string, avatarUrl = '') => {
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; error?: string }>('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatarUrl }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Google login failed' };
    }
    saveAuthSession(data.token, data.user);
    return { success: true };
  };

  const quickDemoLogin = async () => {
    return login('emmanuelisaac888@gmail.com', 'Estimate@2026');
  };

  const logout = async () => {
    if (token) {
      await safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStats(null);
    setIsProfileModalOpen(false);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    const { ok, data, error } = await safeFetchJson<{ success: boolean; user: User; error?: string }>('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Profile update failed' };
    }
    setUser(data.user);
    return { success: true };
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const openAuthModal = (view: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        stats,
        isAuthModalOpen,
        authModalView,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        login,
        register,
        loginWithGoogle,
        quickDemoLogin,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
