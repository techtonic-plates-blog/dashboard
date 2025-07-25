
import { Title } from "@solidjs/meta";
import { createAsync, query, RouteDefinition, useParams, A, useNavigate, action, useAction, redirect } from "@solidjs/router";
import { createResource, ErrorBoundary, Show, Suspense, createSignal, For } from "solid-js";
import { postsClient } from "~/lib/client";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { components } from "$api/posts-client";
import "~/components/styles/typst-scoped.css";

type PostStatus = components["schemas"]["PostsStatusEnum"];

const getStatusVariant = (status: PostStatus): "default" | "success" | "secondary" | "error" => {
    switch (status) {
        case "Draft": return "default";
        case "Published": return "success";
        case "Archived": return "secondary";
        case "Removed": return "error";
        default: return "default";
    }
};

const postQuery = query(async (slug: string) => {
    "use server";

    let { data, response } = await postsClient.GET("/posts/{post_slug}", {
        params: {
            path: { post_slug: slug }
        },
        headers: {
            "Content-Type": "application/json"
        }
    });
    console.log("Post query response:", response.status);
    if (response.status === 404) {
        return redirect(`/posts/${slug}/not-found`, {status: 404});
    }

    if (!data) {
        const err = await response.text();
        throw new Error(`Failed to fetch post: ${err}`);
    }

    const htmlObject = NodeCompiler.create().tryHtml({
        mainFileContent: data.body
    });

    const body = htmlObject.result?.body();
    if (!body) {
        throw new Error("Failed to compile post content");
    }
    data.body = body;

    //console.log(data.body)
    return data;
}, "postQuery");

const deletePostAction = action(async (slug: string) => {
    "use server";

    const { data, response } = await postsClient.DELETE("/posts/{post_slug}", {
        params: {
            path: { post_slug: slug }
        },
        headers: {
            "Content-Type": "application/json"
        },
        parseAs: "text"
    });
    console.log("here");
    if (!response.ok) {
        const err = await response.text();
        console.log("Delete post error:", err);
        throw new Error(`Failed to delete post: ${err}`);
    }
    console.log("Post deleted successfully:", slug);
    return { success: true };
}, "deletePost");

export const route = {
    preload: ({ params }) => {
        postQuery(params.slug);
    }
} satisfies RouteDefinition;

export default function Post() {
    const params = useParams();
    const post = createAsync(() => postQuery(params.slug));
    const deletePostActionFn = useAction(deletePostAction);
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);

    const deletePost = async () => {
        try {
            await deletePostActionFn(params.slug);
            navigate("/posts");
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post. Please try again.");
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
        window.history.back();
    };
    return (
        <section class="w-full px-4 py-8">

            <ErrorBoundary fallback={(err, reset) => (
                <Card class="p-6">
                    <div class="text-center">
                        <h2 class="text-xl font-semibold text-red-600 mb-2">Error Loading Post</h2>
                        <p class="600 mb-4">{err.message}</p>
                        <div class="flex gap-2 justify-center">
                            <Button onClick={reset}>Try Again</Button>
                            <Button variant="outline" onClick={handleBack}>Go Back</Button>
                        </div>
                    </div>
                </Card>
            )}>
                <Suspense fallback={
                    <div class="space-y-4">
                        <div class="animate-pulse  h-8 w-3/4 rounded"></div>
                        <div class="animate-pulse h-4 w-1/2 rounded"></div>
                        <div class="animate-pulse h-64 w-full rounded"></div>
                    </div>
                }>
                    <Show when={post()} fallback={
                        <>
                            
                            <div class="text-center text-gray-500">Loading post...</div>
                        </>
                    }>
                        {(p) => {
                            const postData = p();
                            return (
                                <>
                                    <Title>{postData.title}</Title>
                                    <div class="flex justify-between items-center mb-6">
                                        <Button variant="outline" >
                                            <A href="/posts">← Back to Posts</A>
                                        </Button>
                                        <div class="flex gap-2">
                                            <Button>
                                                <A href={`/posts/${params.slug}/edit`}>Edit Post</A>
                                            </Button>
                                            <Dialog open={isDeleteModalOpen()} onOpenChange={setIsDeleteModalOpen}>
                                                <DialogTrigger as={Button} variant="destructive">
                                                    Delete Post
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Delete Post</DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you want to delete "{postData.title}"? This action cannot be undone.
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
                                                            onClick={deletePost}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                    <Card class="overflow-hidden">
                                        <div class="p-6 border-b">
                                            <h1 class="text-3xl font-bold mb-2">
                                                {postData.title}
                                            </h1>
                                            {postData.subheading && (
                                                <p class="text-xl text-gray-600 mb-4">
                                                    {postData.subheading}
                                                </p>
                                            )}

                                            {/* Title Image */}
                                            <Show when={postData.hero_image}>
                                                <div class="mb-6">
                                                    <img
                                                        src={postData.hero_image}
                                                        alt={`Title image for ${postData.title}`}
                                                        class="w-full max-w-2xl mx-auto rounded-lg shadow-lg object-cover"
                                                        style="max-height: 400px;"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </Show>

                                            {/* Tags */}
                                            <Show when={postData.tags && postData.tags.length > 0}>
                                                <div class="mb-4">
                                                    <div class="flex items-center gap-2 mb-2">
                                                        <span class="text-sm font-medium text-gray-700">Tags:</span>
                                                    </div>
                                                    <div class="flex flex-wrap gap-2">
                                                        <For each={postData.tags}>
                                                            {(tag: string) => (
                                                                <Badge variant="secondary" class="text-sm">
                                                                    {tag}
                                                                </Badge>
                                                            )}
                                                        </For>
                                                    </div>
                                                </div>
                                            </Show>

                                            <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <div class="flex items-center gap-1">
                                                    <span class="font-medium">Author:</span>
                                                    <span>{postData.author}</span>
                                                </div>
                                                <div class="flex items-center gap-1">
                                                    <span class="font-medium">Status:</span>
                                                    <Badge variant={getStatusVariant(postData.post_status)}>
                                                        {postData.post_status}
                                                    </Badge>
                                                </div>
                                                <div class="flex items-center gap-1">
                                                    <span class="font-medium">Created:</span>
                                                    <span>{formatDate(postData.creation_time)}</span>
                                                </div>
                                                {postData.last_edit && (
                                                    <div class="flex items-center gap-1">
                                                        <span class="font-medium">Last edited:</span>
                                                        <span>{formatDate(postData.last_edit)}</span>
                                                    </div>
                                                )}
                                                <div class="flex items-center gap-1">
                                                    <span class="font-medium">Slug:</span>
                                                    <code class="bg-gray-100 px-2 py-1 rounded text-xs">
                                                        {postData.slug}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>

                                        <div id="typst-body" class="p-2 typst-content" innerHTML={postData.body}>
                                            {postData.body}
                                        </div>

                                        {/* Post footer with additional info */}
                                        <div class=" px-6 py-4 border-t">
                                            <div class="flex justify-between items-center text-sm text-gray-500">
                                                <div>
                                                    <span class="font-medium">Created by:</span>
                                                    <code class="ml-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                                        {postData.created_by}
                                                    </code>
                                                </div>
                                                <div>
                                                    <span class="font-medium">Post ID:</span>
                                                    <code class="ml-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                                        {postData.id}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </>
                            );
                        }}
                    </Show>
                </Suspense>
            </ErrorBoundary>
        </section>
    );
}