import { Title } from "@solidjs/meta";
import DataTable from "~/components/ui/data-table";
import { createResource, ErrorBoundary, Show, Suspense, createSignal, For, Switch, Match } from "solid-js";
import { authClient } from "~/lib/client";
import { A, createAsync, query, RouteDefinition, useNavigate } from "@solidjs/router";
import type { Column } from "~/components/ui/data-table";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useSession } from "~/lib/session";
import { components } from "~/lib/.api/auth-client";
import { Badge } from "~/components/ui/badge";

type UserStatus = components["schemas"]["UserStatusEnum"];

const usersDataQuery = query(async () => {
    "use server";
    let session = await useSession();

    console.log(session.data.user?.permissions);


    const { data: usernames, response: getUserIdsResponse, error } = await authClient.GET("/users", {
        headers: {
            "Content-Type": "application/json"
        }
    });
    console.log(getUserIdsResponse);
    if (!getUserIdsResponse.ok) {
        throw new Error(`Failed to fetch user IDs: ${getUserIdsResponse.statusText}, ${error}`);
    }

    if (!usernames) {
        const err = await getUserIdsResponse.text();
        throw new Error(`Failed to fetch users: ${err}`);
    }


    let { data: usersData, response: usersResponse } = await authClient.POST("/users/batch", {
        body: { usernames: usernames }
    })


    if (!usersData) {
        const err = await usersResponse.text();
        throw new Error(`Failed to fetch users data: ${err}`);
    }

    // Add username to each user object for navigation
    usersData = usersData.map((user, index) => ({
        ...user,
        username: usernames[index]
    }));

    const permissionIds = usersData.map((user) => user.permissions).flat();

    const { data: permissionsData, response: permissionsResponse, error: permissionsError } = await authClient.POST("/permissions/batch", {
        body: { uuids: permissionIds }
    });

    if (permissionsError) {
        throw new Error(`Failed to fetch permissions: ${permissionsError}`);
    }

    usersData.map(user => {
        user.permissions = user.permissions.map(permissionId => {
            const permission = permissionsData.find(p => p.id === permissionId);
            return permission ? permission.permission_name : 'Unknown Permission';
        });
    })

    return usersData;
}, "usersDataQuery")

export const route = {
    preload: () => {
        usersDataQuery();
    }
} satisfies RouteDefinition;



const columns: Column<{
    id: string;
    name: string;
    permissions?: string[];
    status: UserStatus;
}>[] = [
        {
            key: "name",
            label: "Name",
            filterable: true,
            sortable: true,

        },
        {
            key: "id",
            label: "ID",
            filterable: true,
            sortable: true,
        },
        {
            key: "permissions",
            label: "Permissions",
            filterable: true,
            sortable: true,
            render: (permissions: string[]) => (
                <div class="w-full max-h-20 overflow-y-auto flex items-center justify-center">
                    <div class="flex flex-col gap-1">
                        {permissions?.length > 0 ? (
                            <For each={permissions}>
                                {(permission) => (
                                    <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                                        {permission}
                                    </span>
                                )}
                            </For>
                        ) : (
                            <span class="text-gray-500 text-xs">No permissions</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            "label": "Status",
            filterable: true,
            sortable: true,
            render: (value: UserStatus) => (
                <>
                    <Switch
                        fallback={<span class="text-error">Unknown</span>}>
                        <Match when={value == "Inactive"}>
                            <Badge variant={"default"}>Inactive</Badge>
                        </Match>
                        <Match when={value == "Active"}>
                            <Badge variant={"success"}>Active</Badge>
                        </Match>
                
                        <Match when={value == "Banned"}>
                            <Badge variant={"error"}>Banned</Badge>
                        </Match>
                    </Switch>
                </>
            )

        }
    ];

export default function Users() {
    const navigate = useNavigate();
    const users = createAsync(() => usersDataQuery());

    const handleRowClick = (user: any) => {
        console.log("Clicked user:", user);
        if (user.name) {
            navigate(`/users/${user.name}`);
        }
    };

    return (
        <section>
            <Title>Users</Title>
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Users</h1>
                <Button><A href="/users/create">Create user</A></Button>
            </div>
            <section>
                <ErrorBoundary fallback={(err, reset) => (
                    <Card class="p-6">
                        <div class="text-center">
                            <h2 class="text-xl font-semibold text-red-600 mb-2">Error Loading Post</h2>
                            <p class="600 mb-4">{err.message}</p>
                            <div class="flex gap-2 justify-center">
                                <Button onClick={reset}>Try Again</Button>
                            </div>
                        </div>
                    </Card>
                )}>
                    <Suspense>
                        <Show when={users()}>
                            {(u) =>
                                <div class="w-full">
                                    <DataTable
                                        data={u()}
                                        pageSize={10}
                                        columns={columns}
                                        searchableColumns={["name", "id"]}
                                        title="Users Directory"
                                        description="Browse and manage users"
                                        onRowClick={handleRowClick}
                                    />
                                </div>
                            }
                        </Show>
                    </Suspense>
                </ErrorBoundary>
            </section>
        </section>
    );
}