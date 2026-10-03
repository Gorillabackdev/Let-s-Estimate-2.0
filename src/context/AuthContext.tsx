/**
 * Let's Estimate - Authentication & User Context
 * Manages user session state, Master Super Admin Key login, email verification,
 * and user profile access.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserStats } from '../types';
import { safeFetchJson } from '../utils/api';
import { safeStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  stats: UserStats | null;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot' | 'verify' | 'admin-key';
  isProfileModalOpen: boolean;
  openAuthModal: (view?: 'login' | 'register' | 'forgot' | 'verify' | 'admin-key', onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithAdminKey: (adminKey: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  verifyEmail: (code: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  loginWithGoogle: (email: string, name: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lets_estimate_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => safeStorage.getItem(TOKEN_KEY));
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot' | 'verify' | 'admin-key'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

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
        safeStorage.removeItem(TOKEN_KEY);
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
      setIsLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const saveAuthSession = (newToken: string, newUser: User, closeModal = true) => {
    safeStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    if (closeModal) {
      setIsAuthModalOpen(false);
      if (typeof window !== 'undefined') {
        const currentHash = window.location.hash.toLowerCase();
        if (currentHash.includes('register') || currentHash.includes('signup') || currentHash.includes('login')) {
          window.location.hash = '#dashboard';
        }
      }
      if (onSuccessCallback) {
        try {
          onSuccessCallback();
        } catch (err) {
          console.error('Error in onAuthSuccess callback:', err);
        }
        setOnSuccessCallback(null);
      }
    }
  };

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; error?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Invalid credentials' };
    }
    saveAuthSession(data.token, data.user, true);
    return { success: true, user: data.user };
  };

  const loginWithAdminKey = async (adminKey: string) => {
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; error?: string }>('/api/auth/admin-key-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: adminKey.trim() }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Master Admin Key authentication failed' };
    }
    saveAuthSession(data.token, data.user, true);
    return { success: true, user: data.user };
  };

  const register = async (userData: any) => {
    const cleanEmail = (userData.email || '').trim();
    const payload = { ...userData, email: cleanEmail };
    const { ok, data, error } = await safeFetchJson<{ success: boolean; token: string; user: User; verificationCode?: string; error?: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Failed to create account' };
    }
    // Save session and immediately close modal so the user enters their workspace directly
    saveAuthSession(data.token, data.user, true);
    return { success: true, user: data.user };
  };

  const verifyEmail = async (code: string, targetEmail?: string) => {
    const emailToVerify = targetEmail || user?.email;
    if (!emailToVerify) return { success: false, error: 'Email address missing' };

    const { ok, data, error } = await safeFetchJson<{ success: boolean; error?: string }>('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToVerify, code }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Invalid verification PIN' };
    }

    if (token) {
      await fetchCurrentUser(token);
    }
    return { success: true };
  };

  const resendVerification = async (targetEmail?: string) => {
    const emailToVerify = targetEmail || user?.email;
    if (!emailToVerify) return { success: false, error: 'Email address missing' };

    const { ok, data, error } = await safeFetchJson<{ success: boolean; verificationCode?: string; error?: string }>('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToVerify }),
    });

    if (!ok || !data?.success) {
      return { success: false, error: data?.error || error || 'Failed to resend code' };
    }
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

  const logout = async () => {
    if (token) {
      await safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    safeStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStats(null);
    setIsProfileModalOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = '#home';
    }
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

  const openAuthModal = (view: 'login' | 'register' | 'forgot' | 'verify' | 'admin-key' = 'login', onSuccess?: () => void) => {
    setAuthModalView(view);
    if (onSuccess) {
      setOnSuccessCallback(() => onSuccess);
    } else {
      setOnSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const isAdmin = Boolean(
    user && (
      user.role === 'superadmin' ||
      user.role === 'admin' ||
      user.email?.toLowerCase() === 'emmanuelisaac888@gmail.com'
    )
  );

  const isEmailVerified = Boolean(user && (user.email_verified === 1 || user.email_verified === true));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isEmailVerified,
        stats,
        isAuthModalOpen,
        authModalView,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        login,
        loginWithAdminKey,
        register,
        verifyEmail,
        resendVerification,
        loginWithGoogle,
        logout,
        updateProfile,
        refreshUser,
        refreshStats: refreshUser,
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
