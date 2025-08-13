"use server";

import createClient, { Middleware } from "openapi-fetch";
import { paths as postsPaths } from "$api/posts-client";
import { paths as authPaths } from "$api/auth-client";
import { paths as assetsPaths } from "$api/assets-client";
import { getCurrentJWT, logout } from "./session";
import { redirect } from "@solidjs/router";

// Simple auth middleware - just injects JWT and handles 401s
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const jwt = await getCurrentJWT();
    console.log("Auth Middleware - JWT:", jwt);
    if (jwt) {
      request.headers.set("Authorization", `Bearer ${jwt}`);
    }
    return request;
  },

  async onResponse({ response }) {
    // If 401, just logout and redirect
    if (response.status === 401) {
     // await logout();
    //  throw redirect("/login");
    }
    return response;
  },
};

// Create API clients
export const postsClient = createClient<postsPaths>({
  baseUrl: process.env.POSTS_API,
});

export const authClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});

export const assetsClient = createClient<assetsPaths>({
  baseUrl: process.env.ASSETS_API,
});

// Apply middleware to all clients
postsClient.use(authMiddleware);
authClient.use(authMiddleware);
assetsClient.use(authMiddleware);

// Anonymous client for auth operations (login, refresh)
export const anonymousAuthClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});
