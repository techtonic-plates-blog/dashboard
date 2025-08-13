import { action, query, redirect } from "@solidjs/router";
import { login as authLogin, logout as authLogout, requireAuth } from "./session";

// Server actions for login/logout
export const loginAction = action(async (formData: FormData) => {
  "use server";
  
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  if (!username || !password) {
    return { success: false, error: "Username and password required" };
  }
  
  const result = await authLogin(username, password);
  
  if (result.success) {
    throw redirect("/");
  }
  
  return { success: false, error: "Invalid credentials" };
}, "login");

export const logoutAction = action(async () => {
  "use server";
  
  await authLogout();
  throw redirect("/login");
}, "logout");

// Route protection - call this in protected route loaders
export const protectRoute = query(async () => {
  "use server";
  try {
    return await requireAuth();
  } catch (error) {
    console.error("Route protection failed:", error);
    throw redirect("/login");
  }
}, "protectRoute");
