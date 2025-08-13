// Authentication and user management types

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

// Provider-specific auth types
export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Route protection
export interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}
