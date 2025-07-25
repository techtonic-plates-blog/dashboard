import { Title } from "@solidjs/meta";
import { createSignal, Show, For, createEffect } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea, TextFieldErrorMessage } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectHiddenSelect, SelectLabel } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { postsClient } from "~/lib/client";
import { A, useNavigate, action, useSubmission, redirect, createAsync, query, RouteDefinition, useParams } from "@solidjs/router";
import { components } from "$api/posts-client";
import { TypstPreview } from "~/components/typst-preview";

type PostStatus = components["schemas"]["PostsStatusEnum"];

const statusOptions: { value: PostStatus; label: string; variant: "default" | "success" | "secondary" | "error" }[] = [
    { value: "Draft", label: "Draft", variant: "default" },
    { value: "Published", label: "Published", variant: "success" },
    { value: "Archived", label: "Archived", variant: "secondary" },
    { value: "Removed", label: "Removed", variant: "error" }
];


// Query to fetch the current post data
const postQuery = query(async (slug: string) => {
    "use server";

    const { data, response } = await postsClient.GET("/posts/{post_slug}", {
        params: {
            path: { post_slug: slug }
        },
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.status === 404) {
        redirect(`/posts/${slug}/not-found`, { status: 404 });
    }

    if (!data) {
        const err = await response.text();
        throw new Error(`Failed to fetch post: ${err}`);
    }

    return data;
}, "editPostQuery");

// Action to update the post
const updatePost = action(async (formData: FormData) => {
    "use server";

    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const body = formData.get("body") as string;
    const subheading = formData.get("subheading") as string;
    const title_image_url = formData.get("title_image_url") as string;
    const tags_string = formData.get("tags") as string;
    const post_status = formData.get("post_status") as PostStatus;

    // Parse tags from comma-separated string
    const tags = tags_string?.trim() 
        ? tags_string.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

   // console.log(post_status)

    const errors: Record<string, string> = {};

    if (!title?.trim()) {
        errors.title = "Title is required";
    }
    if (!author?.trim()) {
        errors.author = "Author is required";
    }
    if (!body?.trim()) {
        errors.body = "Body is required";
    }
    if (!subheading?.trim()) {
        errors.subheading = "Subheading is required";
    }
    if (!post_status) {
        errors.post_status = "Status is required";
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }

    try {
        console.log("Post status is:", post_status)
        const { data, response } = await postsClient.PATCH("/posts/{post_slug}", {
            params: {
                path: { post_slug: slug }
            },
            body: {
                title: title.trim(),
                author: author.trim(),
                body: body.trim(),
                subheading: subheading.trim(),
                status: post_status,
                title_image_url: title_image_url?.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined
            },
            headers: {
                "Content-Type": "application/json"
            },
            parseAs: "text"
        });
        console.log("Post updated successfully:" + data);
        if (!response.ok) {
            throw new Error(`Failed to update post: ${response.status}`);
        }

        return redirect(`/posts/${data}`);
    } catch (error) {
        console.error("Error updating post:", error);
        if (error instanceof Response) {
            throw error; // Re-throw redirect responses
        }
        return {
            success: false,
            errors: { submit: error instanceof Error ? error.message : "Failed to update post" }
        };
    }
}, "updatePost");

export const route = {
    preload: ({ params }) => {
        postQuery(params.slug);
    }
} satisfies RouteDefinition;

export default function EditPost() {
    const params = useParams();
    const submission = useSubmission(updatePost, ([formData]) => {
        console.log(formData)

        return true
    });
    const post = createAsync(() => postQuery(params.slug));

    const [postBody, setPostBody] = createSignal<undefined | string>(undefined);
    const [selectedStatus, setSelectedStatus] = createSignal<PostStatus | undefined>();

    createEffect(() => {
        let p = post();
        if (p && p.body && postBody() === undefined) {
            setPostBody(p.body);
        }
        if (p && p.post_status && selectedStatus() === undefined) {
            setSelectedStatus(p.post_status);
        }
    });

    





    // Get errors from submission result
    const errors = () => {
        const result = submission.result;
        if (result && !result.success) {
            return result.errors || {};
        }
        return {};
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

    return (
        <section class="w-full max-w-none p-6">
            <Title>Edit Post</Title>

            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold">Edit Post</h1>
                <div class="flex gap-2">
                    <Button variant="outline">
                        <A href={`/posts/${params.slug}`}>View Post</A>
                    </Button>
                    <Button variant="outline">
                        <A href="/posts">Back to Posts</A>
                    </Button>
                </div>
            </div>


            <Show when={post()}>
                {(data) => <>

                    {/* Post metadata display */}
                    <Card class="mb-6">
                        <CardHeader>
                            <CardTitle>Post Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <span class="font-medium">Post ID:</span>
                                    <code class="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                        {data().id}
                                    </code>
                                </div>
                                <div>
                                    <span class="font-medium">Slug:</span>
                                    <code class="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                        {data().slug}
                                    </code>
                                </div>
                                <div>
                                    <span class="font-medium">Created:</span>
                                    <span class="ml-2">{formatDate(data().creation_time)}</span>
                                </div>
                                <Show when={data().last_edit}>
                                    {(last_edit) => <div>
                                        <span class="font-medium">Last edited:</span>
                                        <span class="ml-2">{formatDate(last_edit())}</span>
                                    </div>}
                                </Show>
                                <div>
                                    <span class="font-medium">Created by:</span>
                                    <code class="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                        {data().created_by}
                                    </code>
                                </div>
                                <div>
                                    <span class="font-medium">Status:</span>
                                    <span class="ml-2">
                                        <Badge variant={statusOptions.find(s => s.value === data().post_status)?.variant || "default"}>
                                            {data().post_status}
                                        </Badge>
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Post Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={updatePost} method="post" class="space-y-6">

                                <input type="hidden" name="slug" value={params.slug} />

                                <TextField validationState={errors().title ? "invalid" : "valid"}>
                                    <TextFieldLabel>Title *</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="title"
                                        value={data().title || ""}

                                        placeholder="Enter post title"
                                        disabled={submission.pending}
                                    />
                                    <Show when={errors().title}>
                                        <TextFieldErrorMessage>{errors().title}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().author ? "invalid" : "valid"}>
                                    <TextFieldLabel>Author *</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="author"
                                        value={data().author || ""}
                                        placeholder="Enter author name"
                                        disabled={submission.pending}
                                    />
                                    <Show when={errors().author}>
                                        <TextFieldErrorMessage>{errors().author}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().subheading ? "invalid" : "valid"}>
                                    <TextFieldLabel>Subheading *</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="subheading"
                                        value={data().subheading || ""}
                                        placeholder="Enter post subheading"
                                        disabled={submission.pending}
                                    />
                                    <Show when={errors().subheading}>
                                        <TextFieldErrorMessage>{errors().subheading}</TextFieldErrorMessage>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().title_image_url ? "invalid" : "valid"}>
                                    <TextFieldLabel>Title Image URL</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="title_image_url"
                                        value={data().title_image_url || ""}
                                        placeholder="Enter title image URL (optional)"
                                        disabled={submission.pending}
                                    />
                                    <Show when={errors().title_image_url}>
                                        <TextFieldErrorMessage>{errors().title_image_url}</TextFieldErrorMessage>
                                    </Show>
                                    <Show when={data().title_image_url}>
                                        <div class="mt-2">
                                            <p class="text-sm text-gray-600 mb-2">Preview:</p>
                                            <img
                                                src={data().title_image_url}
                                                alt="Title image preview"
                                                class="max-w-xs rounded-lg shadow-sm border"
                                                style="max-height: 200px;"
                                                loading="lazy"
                                            />
                                        </div>
                                    </Show>
                                </TextField>

                                <TextField validationState={errors().tags ? "invalid" : "valid"}>
                                    <TextFieldLabel>Tags</TextFieldLabel>
                                    <TextFieldInput
                                        type="text"
                                        name="tags"
                                        value={data().tags?.join(", ") || ""}
                                        placeholder="Enter tags separated by commas (optional)"
                                        disabled={submission.pending}
                                    />
                                    <Show when={errors().tags}>
                                        <TextFieldErrorMessage>{errors().tags}</TextFieldErrorMessage>
                                    </Show>
                                    <p class="text-sm text-gray-600 mt-1">
                                        Separate multiple tags with commas (e.g., "technology, programming, web development")
                                    </p>
                                </TextField>

                                <div class="space-y-2">
                                    <Select
                                        value={selectedStatus()}
                                        onChange={setSelectedStatus}
                                        options={statusOptions.map(option => option.value)}
                                        placeholder="Select status"
                                        itemComponent={(props) => (
                                            <SelectItem item={props.item}>
                                                <div class="flex items-center gap-2">
                                                    <Badge variant={statusOptions.find(s => s.value === props.item.rawValue)?.variant || "default"}>
                                                        {props.item.rawValue}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        )}
                                        disabled={submission.pending}
                                    >
                                        <SelectLabel>Status *</SelectLabel>
                                        <SelectTrigger aria-label="Status" class="w-full">
                                            <SelectValue<PostStatus>>
                                                {(state) => (
                                                    <div class="flex items-center gap-2">
                                                        <Badge variant={statusOptions.find(s => s.value === state.selectedOption())?.variant || "default"}>
                                                            {state.selectedOption()}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent />
                                        <SelectHiddenSelect name="post_status" />
                                    </Select>
                                    <Show when={errors().post_status}>
                                        <p class="text-sm text-red-600">{errors().post_status}</p>
                                    </Show>
                                </div>

                                {/* Body Field */}
                                <div class="space-y-4">
                                    <TextField validationState={errors().body ? "invalid" : "valid"}>
                                        <TextFieldLabel>Body *</TextFieldLabel>
                                        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            <div class="space-y-2">
                                                <TextFieldTextArea
                                                    name="body"
                                                    value={postBody() || ""}
                                                    onInput={(i) => setPostBody(i.currentTarget.value)}
                                                    placeholder="Enter post content (Typst syntax)"
                                                    disabled={submission.pending}
                                                    rows={20}
                                                    class="min-h-[500px] resize-y font-mono text-sm"
                                                />
                                                <Show when={errors().body}>
                                                    <TextFieldErrorMessage>{errors().body}</TextFieldErrorMessage>
                                                </Show>
                                            </div>
                                            <div class="hidden xl:block">
                                                <TypstPreview
                                                    content={postBody() || ""}
                                                    class="h-full"
                                                />
                                            </div>
                                        </div>
                                    </TextField>

                                    {/* Mobile preview - show below editor on smaller screens */}
                                    <div class="xl:hidden">
                                        <TypstPreview
                                            content={postBody() || ""}
                                        />
                                    </div>
                                </div>

                                {/* Submit Error */}
                                <Show when={errors().submit}>
                                    <div class="p-4 bg-red-50 border border-red-200 rounded-md">
                                        <p class="text-red-600 text-sm">{errors().submit}</p>
                                    </div>
                                </Show>

                                {/* Submit Buttons */}
                                <div class="flex justify-end space-x-4">
                                    <Button type="button" variant="outline" disabled={submission.pending}>
                                        <A href={`/posts/${params.slug}`}>Cancel</A>
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

                </>}
            </Show>
        </section>
    );
}
