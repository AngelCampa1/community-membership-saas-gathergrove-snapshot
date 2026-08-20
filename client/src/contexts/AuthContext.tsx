/**
 * AuthContext - Authentication context for the application
 * This is a stub implementation that uses the existing auth hook
 */

import React, { createContext, useContext } from 'react';
import { useAuth, type AuthContextType } from '@/hooks/useAuth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;