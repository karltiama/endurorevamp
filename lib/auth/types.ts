import { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
