'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing auth state listener...');
    
    console.log('🔄 AuthProvider: Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 AuthProvider: Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Attempting email/password sign-in...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ AuthProvider: Email/password sign-in successful');
    } catch (error) {
      console.error('❌ AuthProvider: Email/password sign-in failed:', error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    console.log('🔐 AuthProvider: Attempting password change...');
    try {
      if (!user) throw new Error('No user logged in');
      await updatePassword(user, newPassword);
      console.log('✅ AuthProvider: Password change successful');
    } catch (error) {
      console.error('❌ AuthProvider: Password change failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 AuthProvider: Attempting logout...');
    try {
      await signOut(auth);
      console.log('✅ AuthProvider: Logout successful');
    } catch (error) {
      console.error('❌ AuthProvider: Logout failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    changePassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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