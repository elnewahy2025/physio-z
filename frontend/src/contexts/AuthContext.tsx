import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'THERAPIST' | 'SECRETARY' | 'PATIENT';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token and get user data
      axios
        .get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', {
        phone,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user
      setUser(userData);

      // Set default Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear user
    setUser(null);

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
