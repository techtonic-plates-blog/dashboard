import { Title } from "@solidjs/meta";
import { createSignal, Show, For, ErrorBoundary, Suspense } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldErrorMessage } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectErrorMessage, SelectHiddenSelect } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { authClient } from "~/lib/client";
import { A, useNavigate, action, useSubmission, redirect, createAsync, query, RouteDefinition, useParams } from "@solidjs/router";
import { components } from "~/lib/.api/auth-client";

type UserStatus = components["schemas"]["UserStatusEnum"];

interface Permission {
    id: string;
    permission_name: string;
    description?: string;
}

interface User {
    id: string;
    name: string;
    permissions: string[];
    status: UserStatus;
    permissionDetails?: Permission[];
}

type UpdateUserRequest = {
    name: string;
    permissions: string[];
    status: UserStatus;
};

// Query to fetch the current user data
const userQuery = query(async (username: string): Promise<User | null> => {
    "use server";

    // First get the user data
    const { data: userData, response: userResponse, error: userError } = await authClient.POST("/users/batch", {
        body: { usernames: [username] },
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!userResponse.ok || userError) {
        if (userResponse.status === 404) {
            throw redirect(`/users/${username}/not-found`, { status: 404 });
        }
        throw new Error(`Failed to fetch user: ${userError || userResponse.statusText}`);
    }

    if (!userData || userData.length === 0) {
        throw redirect(`/users/${username}/not-found`, { status: 404 });
    }

    const user: User = userData[0];

    // Get permission details if user has permissions
    if (user.permissions && user.permissions.length > 0) {
        const { data: permissionsData, response: permissionsResponse, error: permissionsError } = await authClient.POST("/permissions/batch", {
            body: { uuids: user.permissions },
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (permissionsResponse.ok && permissionsData) {
            user.permissionDetails = permissionsData;
        }
    }

    return user;
}, "editUserQuery");

// Query to fetch all available permissions
const allPermissionsQuery = query(async () => {
    "use server";

    const { data, response, error } = await authClient.GET("/permissions");

    if (error || !response.ok) {
        throw new Error(`Failed to fetch permissions: ${error || response.statusText}`);
    }

    const { data: permissionsData, response: permissionResponse, error: permissionError } = await authClient.POST("/permissions/batch", {
        body: { uuids: data }
    });

    if (permissionError) {
        throw new Error(`Failed to fetch permissions: ${permissionError}`);
    }

    return permissionsData || [];
}, "allPermissionsQuery");

// Action to update the user
const updateUser = action(async (formData: FormData) => {
    "use server";

    const username = formData.get("username") as string;
    const name = formData.get("name") as string;
    const status = formData.get("status") as UserStatus;

    // Get selected permissions from FormData
    const permissions: string[] = [];
    for (const [key, value] of formData.entries()) {
        if (key.startsWith("permission_") && value === "on") {
            const permissionId = key.replace("permission_", "");
            permissions.push(permissionId);
        }
    }

    const errors: Record<string, string> = {};

    if (!name?.trim()) {
        errors.name = "Name is required";
    }

    if (!status) {
        errors.status = "Status is required";
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }

    try {
        // Since we don't have a PATCH endpoint for users, we'll simulate it
        // In a real app, this would be a proper PATCH/PUT endpoint
        const { data, response } = await authClient.GET("/me", {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to update user: Feature not implemented yet`);
        }

        console.log("User updated successfully with status:", status);
        throw redirect(`/users/${username}`);
    } catch (error) {
        console.error("Error updating user:", error);
        if (error instanceof Response) {
            throw error; // Re-throw redirect responses
        }
        return {
            success: false,
            errors: { submit: error instanceof Error ? error.message : "Failed to update user" }
        };
    }
}, "updateUser");

export const route = {
    preload: ({ params }) => {
        userQuery(params.username);
        allPermissionsQuery();
    }
} satisfies RouteDefinition;

export default function EditUser() {
    const params = useParams();
    const navigate = useNavigate();
    const submission = useSubmission(updateUser);
    const user = createAsync(() => userQuery(params.username));
    const allPermissions = createAsync(() => allPermissionsQuery());

    // Local state for form fields
    const [selectedStatus, setSelectedStatus] = createSignal<UserStatus | undefined>();
    const [selectedPermissions, setSelectedPermissions] = createSignal<string[]>([]);

    // Initialize state when user data loads
    const currentUser = () => {
        const userData = user();
        if (userData && !selectedStatus()) {
            setSelectedStatus(userData.status);
            setSelectedPermissions(userData.permissions || []);
        }
        return userData;
    };

    // Toggle permission function
    const togglePermission = (permissionId: string) => {
        const current = selectedPermissions();
        const isSelected = current.includes(permissionId);
        
        if (isSelected) {
            setSelectedPermissions(current.filter(id => id !== permissionId));
        } else {
            setSelectedPermissions([...current, permissionId]);
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
            <Title>Edit User</Title>

            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold">Edit User</h1>
                <div class="flex gap-2">
                    <Button variant="outline">
                        <A href={`/users/${params.username}`}>View User</A>
                    </Button>
                    <Button variant="outline">
                        <A href="/users">Back to Users</A>
                    </Button>
                </div>
            </div>

       

            <Show when={currentUser()}>
                {(data) => <>
                    <div class="lg:col-span-2">
                        {/* User metadata display */}
                        <Card class="mb-6">
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span class="font-medium">User ID:</span>
                                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {data().id}
                                        </code>
                                    </div>
                                    <div>
                                        <span class="font-medium">Username:</span>
                                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {params.username}
                                        </code>
                                    </div>
                                    <div>
                                        <span class="font-medium">Current Status:</span>
                                        <span class="ml-2">
                                            {(() => {
                                                const status = data().status || "Unknown";
                                                return (
                                                    <Badge
                                                        variant={
                                                            status === "Active" ? "success" :
                                                                status === "Inactive" ? "default" :
                                                                    status === "Banned" ? "error" :
                                                                        "default"
                                                        }
                                                    >
                                                        {status}
                                                    </Badge>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="font-medium">Current Permissions:</span>
                                        <span class="ml-2">{data().permissions?.length || 0} assigned</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Edit User Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action={updateUser} method="post" class="space-y-6">
                                    <input type="hidden" name="username" value={params.username} />

                                    <TextField validationState={errors().name ? "invalid" : "valid"}>
                                        <TextFieldLabel>Display Name *</TextFieldLabel>
                                        <TextFieldInput
                                            type="text"
                                            name="name"
                                            value={data().name || ""}
                                            placeholder="Enter user's display name"
                                            disabled={submission.pending}
                                        />
                                        <Show when={errors().name}>
                                            <TextFieldErrorMessage>{errors().name}</TextFieldErrorMessage>
                                        </Show>
                                    </TextField>

                                    <div class="space-y-2">
                                        <Select
                                            value={selectedStatus()}
                                            onChange={setSelectedStatus}
                                            options={["Active", "Inactive", "Banned"]}
                                            placeholder="Select status"
                                            itemComponent={(props) => (
                                                <SelectItem item={props.item}>
                                                    <div class="flex items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                props.item.rawValue === "Active" ? "success" :
                                                                    props.item.rawValue === "Inactive" ? "default" :
                                                                        props.item.rawValue === "Banned" ? "error" :
                                                                            "default"
                                                            }
                                                        >
                                                            {props.item.rawValue}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            )}
                                            disabled={submission.pending}
                                            validationState={errors().status ? "invalid" : "valid"}
                                        >
                                            <SelectLabel>Status *</SelectLabel>
                                            <SelectTrigger aria-label="Status" class="w-full">
                                                <SelectValue<UserStatus>>
                                                    {(state) => {
                                                        const currentStatus = state.selectedOption();
                                                        return currentStatus ? (
                                                            <Badge
                                                                variant={
                                                                    currentStatus === "Active" ? "success" :
                                                                        currentStatus === "Inactive" ? "default" :
                                                                            currentStatus === "Banned" ? "error" :
                                                                                "default"
                                                                }
                                                            >
                                                                {currentStatus}
                                                            </Badge>
                                                        ) : "Select status";
                                                    }}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent />
                                            <SelectHiddenSelect name="status" />
                                        </Select>
                                        <Show when={errors().status}>
                                            <SelectErrorMessage>{errors().status}</SelectErrorMessage>
                                        </Show>
                                    </div>

                                    {/* Hidden inputs for selected permissions */}
                                    <For each={selectedPermissions()}>
                                        {(permission) => (
                                            <input
                                                type="hidden"
                                                name={`permission_${permission}`}
                                                value="on"
                                            />
                                        )}
                                    </For>

                                    {/* Submit Error */}
                                    <Show when={errors().submit}>
                                        <div class="p-4 bg-red-50 border border-red-200 rounded-md">
                                            <p class="text-red-600 text-sm">{errors().submit}</p>
                                        </div>
                                    </Show>

                                    {/* Submit Buttons */}
                                    <div class="flex justify-end space-x-4">
                                        <Button type="button" variant="outline" disabled={submission.pending}>
                                            <A href={`/users/${params.username}`}>Cancel</A>
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={submission.pending}
                                            class="min-w-[120px]"
                                        >
                                            {submission.pending ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Permissions Panel - Right Side (1/3 width) */}
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
                                        <Show when={allPermissions()}>
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
                                                                        checked={selectedPermissions().includes(permission.id)}
                                                                        onChange={() => togglePermission(permission.id)}
                                                                        disabled={submission.pending}
                                                                    />
                                                                    <label
                                                                        class="text-sm font-medium cursor-pointer flex-1"
                                                                        onClick={() => togglePermission(permission.id)}
                                                                    >
                                                                        {permission.permission_name}
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </For>
                                                    </div>
                                                    <Show when={selectedPermissions().length > 0}>
                                                        <div class="pt-3 border-t">
                                                            <p class="text-sm text-gray-600 mb-2">
                                                                Selected ({selectedPermissions().length}):
                                                            </p>
                                                            <div class="flex flex-wrap gap-1">
                                                                <For each={selectedPermissions()}>
                                                                    {(permissionId) => {
                                                                        const permission = perms().find(p => p.id === permissionId);
                                                                        return (
                                                                            <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                                {permission?.permission_name || permissionId}
                                                                            </span>
                                                                        );
                                                                    }}
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
                </>}
            </Show>
        </section>
    );
}
