'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthResponse, UserResponse } from '@/types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  fetchCurrentUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drecs_token');
      localStorage.removeItem('drecs_user');
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Logout successful — auth state cleared');
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get<UserResponse>('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('drecs_user', JSON.stringify(response.data.user));
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] Current user loaded:', response.data.user.name, `(${response.data.user.role})`);
        }
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch current user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('drecs_token');
        const storedUser = localStorage.getItem('drecs_user');

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.error('Error parsing cached user profile:', e);
            }
          }
          await fetchCurrentUser();
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token: newToken, user: newUser } = response.data;

      if (newToken && newUser) {
        setToken(newToken);
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('drecs_token', newToken);
          localStorage.setItem('drecs_user', JSON.stringify(newUser));
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] Login successful:', newUser.name, `(${newUser.role})`);
        }
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { token: newToken, user: newUser } = response.data;

      if (newToken && newUser) {
        setToken(newToken);
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('drecs_token', newToken);
          localStorage.setItem('drecs_user', JSON.stringify(newUser));
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
