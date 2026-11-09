'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { apiService } from '@/services/api';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
}

function parsePayload(token: string): JWTPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64)) as JWTPayload;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('turnovivo_token');
    if (savedToken) {
      try {
        const payload = parsePayload(savedToken);
        // Hydrate auth state from persisted token on app bootstrap.
        setToken(savedToken);
        setUser({ id: payload.sub, email: payload.email, role: payload.role });
      } catch {
        Cookies.remove('turnovivo_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    const isHttps = window.location.protocol === 'https:';
    Cookies.set('turnovivo_token', newToken, { expires: 1, secure: isHttps, sameSite: 'strict' });
    
    const payload = parsePayload(newToken);

    setToken(newToken);
    setUser({ id: payload.sub, email: payload.email, role: payload.role });
  };

  const logout = async () => {
    const currentToken = Cookies.get('turnovivo_token');
    
    if (currentToken) {
      try {
        await apiService.logout(currentToken);
        console.log('Sesión destruida con éxito en el servidor de Redis');
      } catch (error: unknown) {
        console.error('No se pudo notificar el logout al servidor:', error);
      }
    }
    Cookies.remove('turnovivo_token');
    setToken(null);
    setUser(null);
    window.location.assign('/login');
  };


  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}
