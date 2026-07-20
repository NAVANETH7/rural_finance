'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (payload: any) => Promise<any>;
  verifyOtp: (email: string, otpCode: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userDetails } = res.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userDetails));

      setToken(jwtToken);
      setUser(userDetails);
      return userDetails;
    } catch (err: any) {
      throw err.response?.data || { message: 'Network error during login' };
    }
  };

  const signup = async (payload: any) => {
    try {
      const res = await api.post('/auth/signup', payload);
      return res.data;
    } catch (err: any) {
      throw err.response?.data || { message: 'Network error during signup' };
    }
  };

  const verifyOtp = async (email: string, otpCode: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otpCode });
      return res.data;
    } catch (err: any) {
      throw err.response?.data || { message: 'Network error during OTP verification' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        verifyOtp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
