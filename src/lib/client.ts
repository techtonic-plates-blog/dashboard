"use server";

import createClient, { Middleware } from "openapi-fetch";
import { paths as postsPaths } from "$api/posts-client";
import { paths as authPaths } from "$api/auth-client";
import { paths as assetsPaths } from "$api/assets-client";
import { useSession, clearUserSession, isSessionValid, getJwtToken, refreshJwtToken } from "./session";
import { redirect } from "@solidjs/router";

// Combined auth middleware that handles JWT injection and 401 responses
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    try {
      const session = await useSession();
      const sessionData = session.data;

      if (sessionData?.tokens) {
        const now = Date.now() / 1000;
        const jwtExp = sessionData.tokens.jwtExp;

        // If JWT is expired, try to refresh
        if (jwtExp < now) {
          console.log("JWT is expired, attempting refresh before request");
          const refreshSuccess = await refreshJwtToken();

          if (!refreshSuccess) {
            console.log("Token refresh failed, will let 401 response handle it");
          }
        }
      }

      const jwt = await getJwtToken();
      if (jwt) {
        request.headers.set("Authorization", `Bearer ${jwt}`);
      }
    } catch (error) {
      console.error("Error in auth middleware onRequest:", error);
    }

    return request;
  },

  async onResponse({ response, request }) {
    if (response.status === 500) {

      let resText = await response.text();
      console.log("Received 500 response:" + resText);
    }
    if (response.status === 401) {
      let resText = await response.text();
      console.log("Received 401 response:" + resText);

      console.log("401 response received, verifying JWT with /me endpoint");

      try {
        const sessionValid = await isSessionValid();

        if (!sessionValid) {
          console.log("Session invalid, clearing and redirecting to login");
          await clearUserSession();
          throw redirect("/login");
        }

        // Get current JWT token
        const jwt = await getJwtToken();
        if (!jwt) {
          console.log("No JWT found in session, redirecting to login");
          await clearUserSession();
          throw redirect("/login");
        }

    
        const meResponse = await anonymousAuthClient.GET("/me", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (meResponse.error) {
          console.log("JWT validation failed at /me endpoint, redirecting to login");
          await clearUserSession();
          throw redirect("/login");
        } else {
          console.log("JWT is valid at /me but got 401 from original request - might be a permission issue");
   
        }

      } catch (error) {
        if (error instanceof Response && error.status === 302) {
          // Re-throw redirects
          throw error;
        }
        console.error("Error in auth middleware onResponse:", error);
        await clearUserSession();
        throw redirect("/login");
      }
    }

    return response;
  }
};

// Create a client for the Posts API
export const postsClient = createClient<postsPaths>({
  baseUrl: process.env.POSTS_API,
});


// Create a client for the Auth API
export const authClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});

export const anonymousAuthClient = createClient<authPaths>({
  baseUrl: process.env.AUTH_API,
});


// Create a client for the Assets API
export const assetsClient = createClient<assetsPaths>({
  baseUrl: process.env.ASSETS_API,
});

assetsClient.use(authMiddleware);
postsClient.use(authMiddleware);
authClient.use(authMiddleware);