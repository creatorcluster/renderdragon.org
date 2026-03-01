import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, AuthResult } from "@/providers/AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set up auth state listener FIRST
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session?.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Keep profiles.avatar_url in sync with the latest auth metadata
    useEffect(() => {
        const syncAvatar = async () => {
            if (!user) return;
            const meta = (user.user_metadata as Record<string, unknown>) || {};
            let avatarUrl: string | undefined = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined);

            // If not present in user_metadata, try to infer from identities (GitHub/Discord)
            if (!avatarUrl) {
                const identities = (user.identities ?? []) as Array<{
                    provider?: string | null;
                    identity_data?: Record<string, unknown> | null;
                }>;
                for (const ident of identities) {
                    const provider = (ident.provider || '').toLowerCase();
                    const data = ident.identity_data || {};
                    // GitHub commonly exposes avatar_url; if missing, construct from numeric id
                    if (!avatarUrl && provider === 'github') {
                        avatarUrl = (data.avatar_url as string | undefined) || (data.picture as string | undefined);
                        if (!avatarUrl) {
                            const ghId = (data.id as number | string | undefined)?.toString();
                            if (ghId) avatarUrl = `https://avatars.githubusercontent.com/u/${ghId}?v=4`;
                        }
                    }
                    // Discord may expose id + avatar hash; construct CDN URL if present
                    if (!avatarUrl && provider === 'discord') {
                        const discordId = data.id as string | undefined;
                        const avatarHash = data.avatar as string | undefined;
                        const discordDirect = (data.avatar_url as string | undefined) || (data.picture as string | undefined);
                        if (discordDirect) avatarUrl = discordDirect;
                        else if (discordId && avatarHash) {
                            avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128`;
                        }
                        else if (discordId && !avatarHash) {
                            // Use a neutral default embed avatar when no custom avatar
                            avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
                        }
                    }
                    // Google exposes avatar_url or picture
                    if (!avatarUrl && provider === 'google') {
                        avatarUrl = (data.avatar_url as string | undefined) || (data.picture as string | undefined);
                    }
                }
            }

            // Only attempt to store http/https/data URLs
            const isSafeUrl = (url?: string) => {
                if (!url) return false;
                try {
                    const u = new URL(url);
                    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:';
                } catch {
                    return false;
                }
            };

            if (!isSafeUrl(avatarUrl)) return;

            try {
                // Upsert to ensure row exists; set latest avatar_url
                const { error } = await supabase
                    .from('profiles')
                    .upsert(
                        { id: user.id, email: user.email, avatar_url: avatarUrl },
                        { onConflict: 'id' }
                    );
                if (error) console.warn('Avatar sync warning:', error.message);
                else console.debug('Avatar synced to profiles:', avatarUrl);
            } catch (e) {
                console.warn('Avatar sync error:', e);
            }
        };

        void syncAvatar();
    }, [user]);

    // UPDATED signUp function
    const signUp = async (
        email: string,
        password: string,
        displayName: string,
        firstName: string,
        lastName: string,
        captchaToken: string | null,
    ): Promise<AuthResult> => {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                captchaToken: captchaToken || undefined, // Pass captcha token
                data: {
                    // Pass custom user metadata here
                    display_name: displayName,
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) {
            console.error("Sign up error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    // UPDATED signIn function
    const signIn = async (
        email: string,
        password: string,
        captchaToken: string | null,
    ): Promise<AuthResult> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                captchaToken: captchaToken || undefined, // Pass captcha token
            },
        });

        if (error) {
            console.error("Sign in error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    // UPDATED signOut function
    const signOut = async (): Promise<AuthResult> => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign out error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    // Helper function to extract username from email
    const getUsernameFromEmail = (email: string | null | undefined): string => {
        if (!email) return "User";
        return email.split("@")[0] || "User";
    };

    const signInWithGitHub = async (): Promise<AuthResult> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            console.error("GitHub sign in error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const signInWithDiscord = async (): Promise<AuthResult> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            console.error("Discord sign in error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const signInWithGoogle = async (): Promise<AuthResult> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        if (error) {
            console.error("Google sign in error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const refreshUser = async () => {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
            console.error("Failed to refresh user:", error);
        } else {
            console.log("User refreshed successfully:", data.user);
            setSession(data.session);
            setUser(data.user ?? null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signUp,
                signIn,
                signOut,
                signInWithGitHub,
                signInWithDiscord,
                signInWithGoogle,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
