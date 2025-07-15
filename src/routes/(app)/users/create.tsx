import { Title } from "@solidjs/meta";
import { createSignal, Show, For, createResource, ErrorBoundary, Suspense } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldErrorMessage } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { authClient } from "~/lib/client";
import { A, useNavigate, action, useSubmission, redirect, createAsync, query, RouteDefinition } from "@solidjs/router";
import { components } from "$api/auth-client";
import { Checkbox } from "~/components/ui/checkbox";

type RegisterRequest = components["schemas"]["RegisterRequest"];

// Query to fetch available permissions
const permissionsQuery = query(async () => {
    "use server";
    
    const { data, response, error } = await authClient.GET("/permissions");
    
    if (error || !response.ok) {
        throw new Error(`Failed to fetch permissions: ${error || response.statusText}`);
    }

    const {data: permissionsData, response: permissionResponse, error: permissionError} = await authClient.POST("/permissions/batch", {
        body: { uuids: data }
    });

    if (permissionError) {
        throw new Error(`Failed to fetch permissions: ${permissionError}`);
    }

    return permissionsData || [];
}, "permissionsQuery");

const createUser = action(async (formData: FormData) => {
    "use server";
    
    // Validation
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    // Get selected permissions from FormData
    const permissions: string[] = [];
    for (const [key, value] of formData.entries()) {
        if (key.startsWith("permission_") && value === "on") {
            const permissionName = key.replace("permission_", "");
            permissions.push(permissionName);
        }
    }

    const errors: Record<string, string> = {};

    if (!username?.trim()) {
        errors.username = "Username is required";
    } else if (username.trim().length < 3) {
        errors.username = "Username must be at least 3 characters long";
    }

    if (!password?.trim()) {
        errors.password = "Password is required";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
    }

    if (!confirmPassword?.trim()) {
        errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }
    
    try {
        const { data, error } = await authClient.POST("/users", {
            body: {
                username: username.trim(),
                password: password,
                permissions: permissions
            },
            parseAs: "text"
        });
        
        if (error) {
            throw new Error(`Failed to create user: ${error}`);
        }

        throw redirect("/users");
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Response) {
            throw error; // Re-throw redirect responses
        }
        return { 
            success: false, 
            errors: { submit: error instanceof Error ? error.message : "Failed to create user" }
        };
    }
}, "createUser");

export default function CreateUser() {
    const navigate = useNavigate();
    const submission = useSubmission(createUser);
    const permissions = createAsync(() => permissionsQuery());

    // Form state for controlled inputs
    const [formData, setFormData] = createSignal<RegisterRequest & { confirmPassword: string }>({
        username: "",
        password: "",
        confirmPassword: "",
        permissions: []
    });

    const updateFormData = (field: keyof (RegisterRequest & { confirmPassword: string })) => (value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePermission = (permission: string) => {
        const currentPermissions = formData().permissions;
        const isSelected = currentPermissions.includes(permission);
        
        if (isSelected) {
            updateFormData("permissions")(currentPermissions.filter(p => p !== permission));
        } else {
            updateFormData("permissions")([...currentPermissions, permission]);
        }
    };

    // Get errors from submission result
    const errors = () => {
        const result = submission.result;
        if (result && !result.success) {
            return result.errors || {};
        }
        return {};
    };

    return (
        <section class="w-full max-w-none p-6">
            <Title>Create New User</Title>
            
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold">Create New User</h1>
                <Button variant="outline">
                    <A href="/users">Back to Users</A>
                </Button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
                <div class="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={createUser} method="post" class="space-y-6">
                                {/* Username Field */}
                                <TextField validationState={errors().username ? "invalid" : "valid"}>
                                    <TextFieldLabel>Username *</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="username"
                                        value={formData().username}
                                        onInput={(e) => updateFormData("username")(e.currentTarget.value)}
                                        placeholder="Enter username"
                                        disabled={submission.pending}
                                        autocomplete="username"
                                    />
                                    <Show when={errors().username}>
                                        <TextFieldErrorMessage>{errors().username}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().password ? "invalid" : "valid"}>
                                    <TextFieldLabel>Password *</TextFieldLabel>
                                    <TextFieldInput
                                        type="password"
                                        name="password"
                                        value={formData().password}
                                        onInput={(e) => updateFormData("password")(e.currentTarget.value)}
                                        placeholder="Enter password"
                                        disabled={submission.pending}
                                        autocomplete="new-password"
                                    />
                                    <Show when={errors().password}>
                                        <TextFieldErrorMessage>{errors().password}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().confirmPassword ? "invalid" : "valid"}>
                                    <TextFieldLabel>Confirm Password *</TextFieldLabel>
                                    <TextFieldInput
                                        type="password"
                                        name="confirmPassword"
                                        value={formData().confirmPassword}
                                        onInput={(e) => updateFormData("confirmPassword")(e.currentTarget.value)}
                                        placeholder="Confirm password"
                                        disabled={submission.pending}
                                        autocomplete="new-password"
                                    />
                                    <Show when={errors().confirmPassword}>
                                        <TextFieldErrorMessage>{errors().confirmPassword}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                {/* Hidden inputs for selected permissions */}
                                <For each={formData().permissions}>
                                    {(permission) => (
                                        <input
                                            type="hidden"
                                            name={`permission_${permission}`}
                                            value="on"
                                        />
                                    )}
                                </For>

                                <Show when={errors().submit}>
                                    <div class="p-4 bg-red-50 border border-red-200 rounded-md">
                                        <p class="text-red-600 text-sm">{errors().submit}</p>
                                    </div>
                                </Show>

                                <div class="flex justify-end space-x-4">
                                    <Button type="button" variant="outline" disabled={submission.pending}>
                                        <A href="/users">Cancel</A>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submission.pending}
                                        class="min-w-[120px]"
                                    >
                                        {submission.pending ? "Creating..." : "Create User"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div class="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ErrorBoundary fallback={(err, reset) => (
                                <div class="text-center">
                                    <p class="text-red-600 text-sm mb-4">Error loading permissions: {err.message}</p>
                                    <Button onClick={reset} size="sm">Try Again</Button>
                                </div>
                            )}>
                                <Suspense fallback={
                                    <div class="space-y-3">
                                        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                }>
                                    <Show when={permissions()}>
                                        {(perms) => (
                                            <div class="space-y-3">
                                                <p class="text-sm text-gray-600 mb-4">
                                                    Select permissions for this user:
                                                </p>
                                                <div class="space-y-2 max-h-64 overflow-y-auto">
                                                    <For each={perms()}>
                                                        {(permission) => (
                                                            <div class="flex items-center space-x-3">
                                                                <Checkbox
                                                                    checked={formData().permissions.includes(permission.id)}
                                                                    onChange={() => togglePermission(permission.id)}
                                                                    disabled={submission.pending}
                                                                />
                                                                <label 
                                                                    class="text-sm font-medium cursor-pointer"
                                                                    onClick={() => togglePermission(permission.id)}
                                                                >
                                                                    {permission.permission_name}
                                                                </label>
                                                            </div>
                                                        )}
                                                    </For>
                                                </div>
                                                <Show when={formData().permissions.length > 0}>
                                                    <div class="pt-3 border-t">
                                                        <p class="text-sm text-gray-600 mb-2">
                                                            Selected ({formData().permissions.length}):
                                                        </p>
                                                        <div class="flex flex-wrap gap-1">
                                                            <For each={formData().permissions}>
                                                                {(permission) => (
                                                                    <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                        {permission}
                                                                    </span>
                                                                )}
                                                            </For>
                                                        </div>
                                                    </div>
                                                </Show>
                                            </div>
                                        )}
                                    </Show>
                                </Suspense>
                            </ErrorBoundary>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

export const route = {
    preload: () => {
        permissionsQuery();
    }
} satisfies RouteDefinition;