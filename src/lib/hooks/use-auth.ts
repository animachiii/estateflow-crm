'use client';

import { createContext, useContext } from 'react';
import type { Profile } from '@/types';

interface AuthContextValue {
  profile: Profile | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  profile: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}
