'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SEEDED_USERS } from './constants';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  isLoggedIn: boolean;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Corporate Super Admin for development convenience, or read from localStorage
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEEDED_USERS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem('amg_active_user_email');
    const loggedInState = localStorage.getItem('amg_is_logged_in');
    if (savedEmail) {
      const match = SEEDED_USERS.find((u) => u.email === savedEmail);
      if (match) setCurrentUser(match);
    }
    if (loggedInState !== null) {
      setIsLoggedIn(loggedInState === 'true');
    }
  }, []);

  const switchRole = (role: UserRole) => {
    const targetUser = SEEDED_USERS.find((u) => u.role === role) || SEEDED_USERS[0];
    setCurrentUser(targetUser);
    setIsLoggedIn(true);
    localStorage.setItem('amg_active_user_email', targetUser.email);
    localStorage.setItem('amg_is_logged_in', 'true');
  };

  const setUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('amg_active_user_email', user.email);
    localStorage.setItem('amg_is_logged_in', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('amg_is_logged_in', 'false');
    // Clear cookies via server logout route
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole: currentUser.role,
        switchRole,
        setUser,
        logout,
        isLoggedIn,
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
