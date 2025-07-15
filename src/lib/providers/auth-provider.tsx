import { createContext, useContext, createSignal, createEffect, JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { action, query, useAction } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { authClient } from "../client";
import { components } from "$api/auth-client";
import { useSession, setUserSession, isSessionValid, clearUserSession, updateUserActivity } from "../session";

export type User = components["schemas"]["MeInfo"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type Tokens = components["schemas"]["Tokens"];

// Server actions for auth operations
const loginAction = action(async (formData: FormData) => {
    "use server";
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
        const { data, error, response } = await authClient.POST("/auth/login", {
            body: { username, password },
        });
       // console.log(data);
     //   console.log(error)
        if (!error && data) {
            //console.log("here")
            const tokens = data as Tokens;
            //console.log("here")
            // Get user info after successful login
            const userResponse = await authClient.GET("/me", {
                headers: {
                    Authorization: `Bearer ${tokens.jwt.token}`
                }
            });
           // console.log(userResponse)
            if (!userResponse.error && userResponse.data) {
                console.log("here2")
                const user = userResponse.data as User;
                console.log(user)
                // Store user and tokens in session using helper function
                await setUserSession(user, {
                    jwt: tokens.jwt.token,
                    refresher: tokens.refresher.token,
                    jwtExp: tokens.jwt.exp,
                    refresherExp: tokens.refresher.exp,
                });

                return {
                    success: true,
                    user,
                };
            }
        }
        //const err = await response.text();
        return { success: false, error: "Login failed" };
    } catch (err: any) {
        console.log("Login failed:", err);
        return { success: false, error: "Login failed: " + err.toString() };
    }
});



const getCurrentUserQuery = query(async () => {
    "use server";
    try {
        // Check if session is valid
        const sessionValid = await isSessionValid();
        if (!sessionValid) {
            await clearUserSession();
            return { success: false, user: null };
        }

        // Update activity timestamp
        await updateUserActivity();

        // Get user from session
        const session = await useSession();
        const sessionData = session.data;

        if (sessionData?.user) {
            return { success: true, user: sessionData.user };
        }

        return { success: false, user: null };
    } catch (err) {
        console.error("Failed to get current user:", err);
        return { success: false, user: null };
    }
}, "getCurrentUser");

const logoutAction = action(async () => {
    "use server";
    try {
        await clearUserSession();
        return { success: true };
    } catch (err) {
        console.error("Logout failed:", err);
        return { success: false };
    }
});

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextType {
    state: AuthState;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => void;
    user: () => User | null;
    isAuthenticated: () => boolean;
    isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props: { children: JSX.Element }) {
    const [state, setState] = createStore<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const loginActionFn = useAction(loginAction);
    const logoutActionFn = useAction(logoutAction);

    // Check for existing session on mount
    createEffect(async () => {
        try {
            const result = await getCurrentUserQuery();

            if (result.success && result.user) {
                setState({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Failed to check auth status:", err);
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    });

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setState("isLoading", true);

            const formData = new FormData();
            formData.set("username", username);
            formData.set("password", password);

            const result = await loginActionFn(formData);
            console.log(result)
            if (result.success && result.user) {
                setState({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return true;
            } else {
                setState("isLoading", false);
                return false;
            }
        } catch (err) {
            console.error("Login failed:", err);
            setState("isLoading", false);
            return false;
        }
    };

    const logout = async () => {
        try {
            await logoutActionFn();
            // Clear local state
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        } catch (err) {
            console.error("Logout failed:", err);
            // Still clear local state even if server logout fails
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    };

    const refreshUser = async () => {
        try {
            const result = await getCurrentUserQuery();
            if (result.success && result.user) {
                setState("user", result.user);
            }
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    const contextValue: AuthContextType = {
        state,
        login,
        logout,
        refreshUser,
        user: () => state.user,
        isAuthenticated: () => state.isAuthenticated,
        isLoading: () => state.isLoading,
    };

    return (
        <AuthContext.Provider value={contextValue}>
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

// Safe version that returns null instead of throwing
export function useAuthSafe() {
    const context = useContext(AuthContext);
    return context || null;
}

// Helper hooks for common use cases
export function useUser() {
    const { state } = useAuth();
    return () => state.user;
}

export function useIsAuthenticated() {
    const { state } = useAuth();
    return () => state.isAuthenticated;
}

export function useIsLoading() {
    const { state } = useAuth();
    return () => state.isLoading;
}
