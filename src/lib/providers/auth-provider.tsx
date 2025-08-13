import { createContext, useContext, JSX } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import { getCurrentUser } from "../session";

// Simple user type
export type User = {
  id: string;
  username: string;
  permissions: Array<{ action: string; resource: string }>;
};

// Server query to get current user
const currentUserQuery = query(async () => {
  "use server";
  return await getCurrentUser();
}, "currentUser");

// Simple auth context
const AuthContext = createContext<() => User | null>();

export function AuthProvider(props: { children: JSX.Element }) {
  const user = createAsync(() => currentUserQuery());
  
  // Convert accessor to function that returns User | null
  const getUser = () => user() || null;
  
  return (
    <AuthContext.Provider value={getUser}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Convenience function
export function useUser() {
  return useAuth();
}
