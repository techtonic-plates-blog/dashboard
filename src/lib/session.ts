"use server";

import { useSession, type SessionConfig, getSession } from "vinxi/http";
import { redirect } from "@solidjs/router";
import createClient from "openapi-fetch";
import { paths as authPaths } from "$api/auth-client";
import {redisClient} from "./redis";

// Anonymous client for auth operations (no middleware)
const anonymousAuthClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});

type UserData = {
  id: string;
  username: string;
  permissions: Array<{ action: string; resource: string }>;
}

// Refactor AuthSession to only hold userId and loginAt
type AuthSession = {
  userId?: string;
  loginAt?: number;
};

// Refactor AuthData to separate JWT and refresher tokens into distinct objects
type AuthData = {
  id: string;
  username: string;
  permissions: Array<{ action: string; resource: string }>;
  tokens: {
    jwt: {
      token: string;
      exp: number;
    };
    refresher: {
      token: string;
      exp: number;
    };
  };
  loginAt: number;
};

// Updated sessionConfig to use environment variable for password and added logging for debugging
const sessionConfig: SessionConfig = {
  password: "onmrB83yv8TtcRcLfjXU10EsyUcemtsm9N+XdWzxqZ0=", // Ensure this is consistent across environments
  name: "authSession",
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

    // Store BOTH user data and tokens in Redis
    await redisClient.hSet(`user:${userResponse.data.id}`, {
      id: userResponse.data.id,
      username: userResponse.data.username,
      permissions: JSON.stringify(userResponse.data.permissions || []),
      jwt: JSON.stringify({
        token: data.jwt.token,
        exp: data.jwt.exp,
      }),
      refresher: JSON.stringify({
        token: data.refresher.token,
        exp: data.refresher.exp,
      }),
      loginAt: Date.now(),
    });

    // Update session to only store userId and loginAt
    const session = await useAuthSession();
    await session.update({
      userId: userResponse.data.id,
      loginAt: Date.now(),
    });

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
export async function requireAuth(): Promise<UserData> {
  try {
    const session = await useAuthSession();
    const data = session.data;

    let userDataRaw = await redisClient.hGetAll(`user:${data.userId}`);

    console.log("Current session data:", data);
    if (!userDataRaw || !userDataRaw.id || !userDataRaw.username || !userDataRaw.permissions) {
      throw redirect("/login");
    }

    const userData: UserData = {
      id: userDataRaw.id,
      username: userDataRaw.username,
      permissions: JSON.parse(userDataRaw.permissions),
    };

    return userData;
  } catch (error) {
    console.log("Authentication error:", error);
    throw redirect("/login");
  }
}

// Get current user (returns null if not authenticated)
export async function getCurrentUser(): Promise<UserData | null> {
  const session = await useAuthSession();

  if (!session.data) return null;

  let userData = await redisClient.hGetAll(`user:${session.data.userId}`);

  const user: UserData = {
    id: userData.id || "",
    username: userData.username || "",
    permissions: userData.permissions ? JSON.parse(userData.permissions) : [],
  };

  return user;
}

// Get current JWT for microservice calls
export async function getCurrentJWT(): Promise<string | null> {
  const session = await useAuthSession();
  const data = session.data;

  if (!data?.userId) return null;

  // Retrieve AuthData from Redis
  const authDataRaw = await redisClient.hGetAll(`user:${data.userId}`);
  if (!authDataRaw || !authDataRaw.jwt || !authDataRaw.refresher) return null;

  const authData: AuthData = {
    id: authDataRaw.id,
    username: authDataRaw.username,
    permissions: JSON.parse(authDataRaw.permissions),
    tokens: {
      jwt: JSON.parse(authDataRaw.jwt),
      refresher: JSON.parse(authDataRaw.refresher),
    },
    loginAt: parseInt(authDataRaw.loginAt, 10),
  };

  // Check if JWT is expired
  const now = Date.now() / 1000;
  if (authData.tokens.jwt.exp <= now) {
    // Try to refresh the token
    const refreshed = await refreshJWT(authData);
    if (!refreshed) return null;

    // Get the updated AuthData from Redis
    const updatedAuthDataRaw = await redisClient.hGetAll(`user:${data.userId}`);
    const updatedAuthData: AuthData = {
      id: updatedAuthDataRaw.id,
      username: updatedAuthDataRaw.username,
      permissions: JSON.parse(updatedAuthDataRaw.permissions),
      tokens: {
        jwt: JSON.parse(updatedAuthDataRaw.jwt),
        refresher: JSON.parse(updatedAuthDataRaw.refresher),
      },
      loginAt: parseInt(updatedAuthDataRaw.loginAt, 10),
    };

    return updatedAuthData.tokens.jwt.token;
  }

  return authData.tokens.jwt.token;
}

// Refresh JWT when expired
async function refreshJWT(authData: AuthData): Promise<boolean> {
  try {
    if (!authData.tokens.refresher.token) return false;

    // Check if refresh token is expired
    const now = Date.now() / 1000;
    if (authData.tokens.refresher.exp <= now) return false;

    // Call refresh endpoint
    const { data: newTokens, error } = await anonymousAuthClient.POST("/auth/refresh", {
      body: { refresher: authData.tokens.refresher.token },
    });

    if (error || !newTokens) return false;

    // Update Redis with new tokens
    await redisClient.hSet(`user:${authData.id}`, {
      jwt: JSON.stringify({
        token: newTokens.jwt.token,
        exp: newTokens.jwt.exp,
      }),
      refresher: JSON.stringify({
        token: newTokens.refresher.token,
        exp: newTokens.refresher.exp,
      }),
    });

    return true;
  } catch (error) {
    return false;
  }
}

// Simple permission check
export function hasPermission(
  user: UserData,
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
