import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    
    // Check initial user session
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const profile = await apiClient('/auth/me');
          setUser(profile);
        } catch (error) {
          console.error("Session invalid or expired", error);
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (username, password) => {
    try {
      // The FastAPI backend might expect JSON based on the openapi spec
      // `LoginRequest` schema expects `{ "username": "...", "password": "..." }`
      const data = await apiClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      localStorage.setItem('access_token', data.access_token);
      
      // Fetch profile
      const profile = await apiClient('/auth/me');
      setUser(profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API failed, clearing local state anyway', e);
    }
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
