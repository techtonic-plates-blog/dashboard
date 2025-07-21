import { Title } from "@solidjs/meta";
import DataTable from "~/components/ui/data-table";
import { createResource, ErrorBoundary, Match, Show, Suspense, Switch, createSignal } from "solid-js";
import { postsClient } from "~/lib/client";
import { A, createAsync, query, RouteDefinition, useNavigate } from "@solidjs/router";
import type { Column } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import { components } from "~/lib/.api/posts-client";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Eye } from "lucide-solid";
import { TypstPreview } from "~/components/typst-preview";

type PostStatus = components["schemas"]["PostsStatusEnum"];

// Preview component for individual posts
function PostPreview(props: { post: any }) {
    const [isOpen, setIsOpen] = createSignal(false);

    return (
        <Dialog open={isOpen()} onOpenChange={setIsOpen}>
            <DialogTrigger as={Button} size="sm" variant="outline" class="gap-2">
                <Eye class="w-3 h-3" />
                Preview
            </DialogTrigger>
            <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle class="flex items-center gap-2">
                        <Eye class="h-5 w-5" />
                        {props.post.title}
                    </DialogTitle>
                </DialogHeader>
                <div class="mt-4 max-h-[70vh] overflow-y-auto">
                    <TypstPreview 
                        content={props.post.body}
                        class="border-0 shadow-none"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

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
    post_status: PostStatus;
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
        {
            key: "post_status",
            label: "Status",
            filterable: true,
            sortable: true,
            render: (value: PostStatus) => (
                <>
                    <Switch
                        fallback={<span class="text-error">Unknown</span>}>
                        <Match when={value == "Draft"}>
                            <Badge variant={"default"}>Draft</Badge>
                        </Match>
                        <Match when={value == "Published"}>
                            <Badge variant={"success"}>Published</Badge>
                        </Match>
                        <Match when={value == "Archived"}>
                            <Badge variant={"secondary"}>Archived</Badge>
                        </Match>
                        <Match when={value == "Removed"}>
                            <Badge variant={"error"}>Removed</Badge>
                        </Match>
                    </Switch>
                </>
            )
        },
        {
            key: "id",
            label: "Actions",
            render: (value: string, row: any) => (
                <div class="flex items-center gap-2">
                    <PostPreview post={row} />
                    <Button size="sm" variant="ghost" class="gap-2">
                        <A href={`/posts/${row.slug}`} class="flex items-center gap-2">
                            View
                        </A>
                    </Button>
                </div>
            ),
            priority: 1
        }
    ];

export default function Posts() {
    let navigator = useNavigate();
    const posts = createAsync(() => postsDataQuery());

    const handleRowClick = (post: any) => {
        // Open post in new tab using the slug
        navigator(`/posts/${post.slug}`);
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