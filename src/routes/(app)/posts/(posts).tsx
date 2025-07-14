import { Title } from "@solidjs/meta";
import DataTable from "~/components/ui/data-table";
import { createResource, ErrorBoundary, Show, Suspense } from "solid-js";
import { postsClient } from "~/lib/client";
import { A, createAsync, query, RouteDefinition } from "@solidjs/router";
import type { Column } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";

const postsDataQuery = query(async () => {
    "use server";

    const { data: getPosts, response: getPostsResponse } = await postsClient.GET("/posts", {

        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!getPosts) {
        const err = await getPostsResponse.text();
        throw new Error(`Failed to fetch posts: ${err}`);
    }

    const ids = getPosts.posts;
    const { data, response } = await postsClient.POST("/posts/bulk_get", {
        body: ids
    })

    if (!data) {
        const err = await response.text();
        throw new Error(`Failed to fetch posts data: ${err}`);
    }
   
    return data;
}, "postsDataQuery")

export const route = {
    preload: () => {
        postsDataQuery();
    }
} satisfies RouteDefinition;

const columns: Column<{
    id: string;
    slug: string;
    title: string;
    creation_time: string;
    body: string;
    author: string;
    created_by: string;
    subheading: string;
    last_edit?: string;
}>[] = [
        {
            key: "title",
            label: "Title",
            filterable: true,
            sortable: true,
        },
        {
            key: "author",
            label: "Author",
            filterable: true,
            sortable: true,
        },
        {
            key: "creation_time",
            label: "Creation Time",
            sortable: true,
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
        {
            key: "subheading",
            label: "Subheading",
            filterable: true,
            sortable: true,
        },
    ];

export default function Posts() {

    const posts = createAsync(() => postsDataQuery());

    const handleRowClick = (post: any) => {
        // Open post in new tab using the slug
        window.open(`/posts/${post.slug}`, '_blank');
    };

    return (
        <section>
            <Title>Posts</Title>
            <div class="flex justify-between items-center mb-6">
                <Button class="ml-auto"><A href="/posts/new">Add Post</A></Button>
            </div>
            <section>
                <ErrorBoundary fallback={(err, reset) => (
                    <div class="p-4">
                        <p class="text-error">Error: {err.message}</p>
                        <button onClick={reset} class="mt-2">Try Again</button>
                    </div>
                )}>
                    <Suspense >
                        <Show when={posts()}>
                            {(p) =>
                                <div class="w-full">
                                    <DataTable
                                        data={p()}
                                        pageSize={5}
                                        columns={columns}
                                        searchableColumns={["title", "author", "subheading"]}
                                        title="Posts Directory"
                                        description="Browse and manage posts"
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