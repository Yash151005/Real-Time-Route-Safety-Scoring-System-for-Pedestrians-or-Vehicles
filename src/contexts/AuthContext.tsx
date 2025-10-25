import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age: number;
  modeOfTransport: 'walking' | 'cycling' | 'car' | 'public_transport';
  emergencyContact: string;
  preferences: {
    avoidDarkAreas: boolean;
    preferWellLitRoutes: boolean;
    avoidHighCrimeAreas: boolean;
    preferMainRoads: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convex mutations
  const signInMutation = useMutation(api.simpleAuth.signIn);
  const signUpMutation = useMutation(api.simpleAuth.signUp);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signInMutation({ email, password });
      
      if (result.success && result.userId) {
        // For now, we'll create a basic user object
        // In a real app, you'd fetch the full user profile
        const user: User = {
          _id: result.userId,
          email,
          fullName: '', // Will be updated when we have the full profile
          gender: 'prefer_not_to_say',
          age: 18,
          modeOfTransport: 'car',
          emergencyContact: '',
          preferences: {
            avoidDarkAreas: true,
            preferWellLitRoutes: true,
            avoidHighCrimeAreas: true,
            preferMainRoads: false,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const result = await signUpMutation({
        email: userData.email,
        password: userData.password || '',
        fullName: userData.fullName,
        gender: userData.gender,
        age: userData.age,
        modeOfTransport: userData.modeOfTransport,
        emergencyContact: userData.emergencyContact,
        preferences: userData.preferences,
      });
      
      if (result.success && result.userId) {
        const newUser: User = {
          _id: result.userId,
          ...userData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentUser(newUser);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    setCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}