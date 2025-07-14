
import { type SessionConfig, useSession as useSessionBase } from "vinxi/http"
import { User } from "./providers/auth-provider";

type SessionData = {
    user?: User;
    tokens?: {
        jwt: string;
        refresher: string;
        jwtExp: number;
        refresherExp: number;
    };
    loginAt?: number; // Timestamp when user logged in
    lastActivity?: number; // Track user activity for session timeout
}

export const SessionDefaults = {
    password: process.env.SESSION_SECRET || "onmrB83yv8TtcRcLfjXU10EsyUcemtsm9N+XdWzxqZ0=",
    name: "adminSession",
    maxAge: 60 * 60 * 24 * 31,
    //secure: process.env.NODE_ENV === "production",
  //  httpOnly: true,
    sameSite: "lax" as const,
} as SessionConfig;

export async function useSession(): Promise<ReturnType<typeof useSessionBase<SessionData>>> {
    const session = await useSessionBase<SessionData>(SessionDefaults);
    return session;
}

// Helper functions for better session management
export async function setUserSession(user: User, tokens: { jwt: string; refresher: string; jwtExp: number; refresherExp: number }) {
    const session = await useSession();
    const now = Date.now();
    
    await session.update((data) => ({
        ...data,
        user,
        tokens,
        loginAt: now,
        lastActivity: now,
    }));
}

export async function updateUserActivity() {
    const session = await useSession();
    await session.update((data) => ({
        ...data,
        lastActivity: Date.now(),
    }));
}

export async function isSessionValid(): Promise<boolean> {
    const session = await useSession();
    const data = session.data;
    
    if (!data?.user || !data?.tokens) {
        return false;
    }
    
    const now = Date.now();
    const maxInactivity = 60 * 60 * 1000; // 1 hour of inactivity
    
    // Check if tokens are expired
    if (data.tokens.jwtExp < now / 1000) {
        return false;
    }
    
    // Check if session has been inactive too long
    if (data.lastActivity && (now - data.lastActivity) > maxInactivity) {
        return false;
    }
    
    return true;
}

export async function clearUserSession() {
    const session = await useSession();
    await session.clear();
}

export async function getJwtToken(): Promise<string | null> {
    try {
        const session = await useSession();
        const sessionData = session.data;
        return sessionData?.tokens?.jwt || null;
    } catch (error) {
        console.error("Error getting JWT token:", error);
        return null;
    }
}

export async function refreshTokenIfNeeded(): Promise<boolean> {
    try {
        const session = await useSession();
        const sessionData = session.data;
        
        if (!sessionData?.tokens) {
            return false;
        }
        
        const now = Date.now() / 1000;
        const jwtExp = sessionData.tokens.jwtExp;
        const refresherExp = sessionData.tokens.refresherExp;
        
        // If JWT is expired but refresher is still valid
        if (jwtExp < now && refresherExp > now) {
            // Here you could implement token refresh logic
            // For now, just return false to indicate refresh is needed
            console.log("JWT expired, refresh token is available but refresh logic not implemented");
            return false;
        }
        
        return jwtExp > now;
    } catch (error) {
        console.error("Error checking token refresh:", error);
        return false;
    }
}

export async function refreshJwtToken(): Promise<boolean> {
    try {
        const session = await useSession();
        const sessionData = session.data;
        
        if (!sessionData?.tokens?.refresher) {
            console.log("No refresh token available");
            return false;
        }
        
        const now = Date.now() / 1000;
        if (sessionData.tokens.refresherExp <= now) {
            console.log("Refresh token is expired");
            return false;
        }
        
        // Import authClient here to avoid circular dependency
        const { authClient } = await import("./client");
        
        // Call the refresh endpoint
        const { data, error } = await authClient.POST("/auth/refresh", {
            body: { refresher: sessionData.tokens.refresher },
        });
        
        if (error || !data) {
            console.log("Token refresh failed");
            return false;
        }
        
        // Update session with new tokens
        const tokens = data as any; // Type this based on your Tokens type
        await session.update((currentData) => ({
            ...currentData,
            tokens: {
                jwt: tokens.jwt.token,
                refresher: tokens.refresher.token,
                jwtExp: tokens.jwt.exp,
                refresherExp: tokens.refresher.exp,
            },
            lastActivity: Date.now(),
        }));
        
        console.log("JWT token refreshed successfully");
        return true;
    } catch (error) {
        console.error("Error refreshing JWT token:", error);
        return false;
    }
}