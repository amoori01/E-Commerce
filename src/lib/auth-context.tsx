'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SEEDED_USERS } from './constants';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Corporate Super Admin for immediate complete access, with 1-click persona switching
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEEDED_USERS[0]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('amg_active_user_email');
    if (savedEmail) {
      const match = SEEDED_USERS.find((u) => u.email === savedEmail);
      if (match) setCurrentUser(match);
    }
  }, []);

  const switchRole = (role: UserRole) => {
    const targetUser = SEEDED_USERS.find((u) => u.role === role) || SEEDED_USERS[0];
    setCurrentUser(targetUser);
    localStorage.setItem('amg_active_user_email', targetUser.email);
  };

  const setUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('amg_active_user_email', user.email);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole: currentUser.role,
        switchRole,
        setUser,
        allUsers: SEEDED_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
