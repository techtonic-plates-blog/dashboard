"use server";

import { useSession, type SessionConfig, getSession } from "vinxi/http";
import { redirect } from "@solidjs/router";
import createClient from "openapi-fetch";
import { paths as authPaths } from "$api/auth-client";


// Anonymous client for auth operations (no middleware)
const anonymousAuthClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});

// Session type - stores user data AND JWT for microservice calls
type AuthSession = {
  user?: {
    id: string;
    username: string;
    permissions: Array<{ action: string; resource: string }>;
  };
  tokens?: {
    jwt: string;
    refresher: string;
    jwtExp: number;
    refresherExp: number;
  };
  loginAt?: number;
};

// Updated sessionConfig to use environment variable for password and added logging for debugging
const sessionConfig: SessionConfig = {
  password: "onmrB83yv8TtcRcLfjXU10EsyUcemtsm9N+XdWzxqZ0=", // Ensure this is consistent across environments
  name: "auth",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  cookie: {
    secure: process.env.NODE_ENV === "production", // Secure cookies in production
    sameSite: "lax", // Adjust SameSite if cross-origin requests are needed
    httpOnly: true, // Prevent client-side access to cookies
  },
};

// Use session
export async function useAuthSession() {
  const session = await useSession<AuthSession>(sessionConfig);
  console.log("Session retrieved:", session.data);
  return session;
}

export async function getAuthSession() {
  const session = await getSession<AuthSession>(sessionConfig);
  console.log("Session retrieved:", session.data);
  return session;
}

// Login function - stores both user data and JWT tokens
export async function login(username: string, password: string) {
  try {
    // Call auth API to get JWT tokens
    const { data, error } = await anonymousAuthClient.POST("/auth/login", {
      body: { username, password },
    });

    if (error || !data) {
      return { success: false };
    }

    // Get user info using the JWT
    const userResponse = await anonymousAuthClient.GET("/me", {
      headers: { Authorization: `Bearer ${data.jwt.token}` },
    });

    if (userResponse.error || !userResponse.data) {
      return { success: false };
    }

    // Store BOTH user data and tokens in session
    const session = await useAuthSession();
    await session.update(() => ({
      user: userResponse.data,
      tokens: {
        jwt: data.jwt.token,
        refresher: data.refresher.token,
        jwtExp: data.jwt.exp,
        refresherExp: data.refresher.exp,
      },
      loginAt: Date.now(),
    }));

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Logout
export async function logout() {
  const session = await useAuthSession();
  await session.clear();
}

// Get current user (throws redirect if not authenticated)
export async function requireAuth() {
  try {
    const session = await useAuthSession();
    const data = session.data;
    console.log("Current session data:", data);
    if (!data?.user) {
      throw redirect("/login");
    }

    return data.user;
  }
  catch (error) {
    console.log("Authentication error:", error);
    throw redirect("/login");
  }
}

// Get current user (returns null if not authenticated)
export async function getCurrentUser() {
  const session = await getAuthSession();
  return session.data?.user || null;
}

// Get current JWT for microservice calls
export async function getCurrentJWT(): Promise<string | null> {
  const session = await getAuthSession();
  const data = session.data;

  if (!data?.tokens) return null;

  // Check if JWT is expired
  const now = Date.now() / 1000;
  if (data.tokens.jwtExp <= now) {
    // Try to refresh the token
    const refreshed = await refreshJWT();
    if (!refreshed) return null;

    // Get the new token
    const updatedSession = await getAuthSession();
    return updatedSession.data?.tokens?.jwt || null;
  }

  return data.tokens.jwt;
}

// Refresh JWT when expired
async function refreshJWT(): Promise<boolean> {
  try {
    const session = await useAuthSession();
    const data = session.data;

    if (!data?.tokens?.refresher) return false;

    // Check if refresh token is expired
    const now = Date.now() / 1000;
    if (data.tokens.refresherExp <= now) return false;

    // Call refresh endpoint
    const { data: newTokens, error } = await anonymousAuthClient.POST("/auth/refresh", {
      body: { refresher: data.tokens.refresher },
    });

    if (error || !newTokens) return false;

    // Update session with new tokens
    await session.update((current) => ({
      ...current,
      tokens: {
        jwt: newTokens.jwt.token,
        refresher: newTokens.refresher.token,
        jwtExp: newTokens.jwt.exp,
        refresherExp: newTokens.refresher.exp,
      },
    }));

    return true;
  } catch (error) {
    return false;
  }
}

// Simple permission check
export function hasPermission(
  user: AuthSession["user"],
  action: string,
  resource: string
): boolean {
  if (!user?.permissions) return false;
  return user.permissions.some(p => p.action === action && p.resource === resource);
}

// Added a test route to verify session updates
export async function testSession() {
  const session = await useAuthSession();
  console.log("Testing session update:", session.data);
  await session.update(() => ({
    user: { id: "test", username: "tester", permissions: [] },
    tokens: { jwt: "test-jwt", refresher: "test-refresher", jwtExp: Date.now() / 1000 + 3600, refresherExp: Date.now() / 1000 + 7200 },
    loginAt: Date.now(),
  }));
  console.log("Session after update:", session.data);
  return session.data;
}
