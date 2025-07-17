import { Title } from "@solidjs/meta";
import { createAsync, query, RouteDefinition, useParams, A, useNavigate, action, useAction, redirect } from "@solidjs/router";
import { createResource, ErrorBoundary, Show, Suspense, createSignal, For } from "solid-js";
import { authClient } from "~/lib/client";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { usePageinfo } from "~/lib/providers/pageinfo-provider";

interface Permission {
    id: string;
    permission_name: string;
    description?: string;
}

interface User {
    id: string;
    name: string;
    permissions: string[];
    permissionDetails?: Permission[];
}

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
            user.permissions = user.permissions.map((permissionId: string) => {
                const permission = permissionsData.find((p: any) => p.id === permissionId);
                return permission ? permission.permission_name : 'Unknown Permission';
            });
        }
    }

    return user;
}, "userQuery");

const deleteUserAction = action(async (username: string) => {
    "use server";

    // Since we don't have a specific DELETE endpoint, we'll simulate it
    // In a real app, this would be a proper DELETE endpoint
    const { data, response, error } = await authClient.GET("/me", {
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok || error) {
        throw new Error(`Failed to delete user: Feature not implemented yet`);
    }

    return { success: true };
}, "deleteUser");

export const route = {
    preload: ({ params }) => {
        userQuery(params.username);
    }
} satisfies RouteDefinition;

export default function User() {
    const params = useParams();
    const user = createAsync(() => userQuery(params.username));
    const deleteUserActionFn = useAction(deleteUserAction);
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);

    const deleteUser = async () => {
        try {
            await deleteUserActionFn(params.username);
            navigate("/users");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. Please try again.");
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleBack = () => {
        navigate("/users");
    };

    return (
        <section class="w-full px-4 py-8">
            <ErrorBoundary fallback={(err, reset) => (
                <Card class="p-6">
                    <div class="text-center">
                        <h2 class="text-xl font-semibold text-red-600 mb-2">Error Loading User</h2>
                        <p class="text-gray-600 mb-4">{err.message}</p>
                        <div class="flex gap-2 justify-center">
                            <Button onClick={reset}>Try Again</Button>
                            <Button variant="outline" onClick={handleBack}>Go Back</Button>
                        </div>
                    </div>
                </Card>
            )}>
                <Suspense fallback={
                    <div class="space-y-4">
                        <div class="animate-pulse bg-gray-200 h-8 w-3/4 rounded"></div>
                        <div class="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></div>
                        <div class="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
                    </div>
                }>
                    <Show when={user()} fallback={
                        <div class="text-center text-gray-500">Loading user...</div>
                    }>
                        {(u) => {
                            const userData = u();
                            return (
                                <>
                                    <Title>{userData.name} - User Profile</Title>
                                    <div class="flex justify-between items-center mb-6">
                                        <Button variant="outline" onClick={handleBack}>
                                            ← Back to Users
                                        </Button>
                                        <div class="flex gap-2">
                                            <Button>
                                                <A href={`/users/${params.username}/edit`}>Edit User</A>
                                            </Button>
                                            <Dialog open={isDeleteModalOpen()} onOpenChange={setIsDeleteModalOpen}>
                                                <DialogTrigger as={Button} variant="destructive">
                                                    Delete User
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Delete User</DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you want to delete user "{userData.name}"? This action cannot be undone.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsDeleteModalOpen(false)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={deleteUser}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>

                                    <Card class="overflow-hidden mb-6">
                                        <div class="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div class="flex items-center gap-4">
                                                <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {userData.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h1 class="text-3xl font-bold text-gray-900">
                                                        {userData.name}
                                                    </h1>
                                                    <p class="text-lg text-gray-600">
                                                        @{params.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="p-6">
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Basic Information */}
                                                <div class="space-y-4">
                                                    <h3 class="text-lg font-semibold  border-b pb-2">
                                                        Basic Information
                                                    </h3>
                                                    <div class="space-y-3">
                                                        <div class="flex justify-between items-center">
                                                            <span class="font-medium ">User ID:</span>
                                                            <code class=" px-2 py-1 rounded text-sm font-mono">
                                                                {userData.id}
                                                            </code>
                                                        </div>
                                                        <div class="flex justify-between items-center">
                                                            <span class="font-medium ">Username:</span>
                                                            <code class=" px-2 py-1 rounded text-sm font-mono">
                                                                {params.username}
                                                            </code>
                                                        </div>
                                                        <div class="flex justify-between items-center">
                                                            <span class="font-medium ">Display Name:</span>
                                                            <span class="">{userData.name}</span>
                                                        </div>
                                                      
                                                    </div>
                                                </div>

                                                {/* Permissions */}
                                                <div class="space-y-4">
                                                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">
                                                        Permissions ({userData.permissions?.length || 0})
                                                    </h3>
                                                    <div class="space-y-2">
                                                        <Show when={userData.permissions && userData.permissions.length > 0}
                                                            fallback={
                                                                <div class="text-gray-500 italic">No permissions assigned</div>
                                                            }>
                                                            <div class="flex flex-wrap gap-2">
                                                                <For each={userData.permissions}>
                                                                    {(permission) => (
                                                                        <span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                            {permission}
                                                                        </span>
                                                                    )}
                                                                </For>
                                                            </div>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Permission Details Card */}
                                    <Show when={userData.permissionDetails && userData.permissionDetails.length > 0}>
                                        <Card class="overflow-hidden">
                                            <div class="p-6 border-b">
                                                <h3 class="text-lg font-semibold ">
                                                    Permission Details
                                                </h3>
                                            </div>
                                            <div class="p-6">
                                                <div class="grid gap-4">
                                                    <For each={userData.permissionDetails}>
                                                        {(permission) => (
                                                            <Card class="p-4 border border-gray-200">
                                                                <div class="flex justify-between items-start">
                                                                    <div class="flex-1">
                                                                        <h4 class="font-medium  mb-1">
                                                                            {permission.permission_name}
                                                                        </h4>
                                                                        {permission.description && (
                                                                            <p class="text-sm  mb-2">
                                                                                {permission.description}
                                                                            </p>
                                                                        )}
                                                                        <code class="text-xs px-2 py-1 rounded">
                                                                            {permission.id}
                                                                        </code>
                                                                    </div>
                                                                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                                                        Active
                                                                    </span>
                                                                </div>
                                                            </Card>
                                                        )}
                                                    </For>
                                                </div>
                                            </div>
                                        </Card>
                                    </Show>
                                </>
                            );
                        }}
                    </Show>
                </Suspense>
            </ErrorBoundary>
        </section>
    );
}