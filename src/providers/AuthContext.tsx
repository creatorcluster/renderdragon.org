import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";

// Define the return type for auth operations for better type safety
export interface AuthResult {
    success: boolean;
    error?: string; // Optional error message
}

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (
        email: string,
        password: string,
        displayName: string,
        firstName: string,
        lastName: string,
        captchaToken: string | null,
    ) => Promise<AuthResult>;
    signIn: (
        email: string,
        password: string,
        captchaToken: string | null,
    ) => Promise<AuthResult>;
    signOut: () => Promise<AuthResult>;
    signInWithGitHub: () => Promise<AuthResult>;
    signInWithDiscord: () => Promise<AuthResult>;
    signInWithGoogle: () => Promise<AuthResult>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
