import { Title } from "@solidjs/meta";
import { createSignal, Show, For } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea, TextFieldErrorMessage } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { postsClient } from "~/lib/client";
import { A, useNavigate, action, useSubmission, redirect } from "@solidjs/router";
import { components } from "$api/posts-client";
import { TypstPreview } from "~/components/typst-preview";

type InsertPostRequest = components["schemas"]["InsertPostRequest"];

const createPost = action(async (formData: FormData) => {
    "use server";
    
    // Validation
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const body = formData.get("body") as string;
    const subheading = formData.get("subheading") as string;
    const hero_image = formData.get("hero_image") as string;
    const tags_string = formData.get("tags") as string;

    // Parse tags from comma-separated string
    const tags = tags_string?.trim() 
        ? tags_string.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

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

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }
    
    try {
        const { data, response, error } = await postsClient.POST("/posts", {
            body: {
                title: title.trim(),
                author: author.trim(),
                body: body.trim(),
                subheading: subheading.trim(),
                hero_image: hero_image?.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined
            },
            parseAs: "text"
        });
        
        if (error) {
            throw new Error(`Failed to create post: ${error}`);
        }

        // Redirect to the posts list page after successful creation
        throw redirect(data!);
    } catch (error) {
        console.error("Error creating post:", error);
        if (error instanceof Response) {
            throw error; // Re-throw redirect responses
        }
        return { 
            success: false, 
            errors: { submit: error instanceof Error ? error.message : "Failed to create post" }
        };
    }
}, "createPost");

export default function NewPost() {
    const navigate = useNavigate();
    const submission = useSubmission(createPost);

    // Form state for controlled inputs
    const [formData, setFormData] = createSignal<InsertPostRequest>({
        title: "",
        author: "",
        body: "",
        subheading: "",
        hero_image: "",
        tags: []
    });

    const updateFormData = (field: keyof InsertPostRequest) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const [tagInput, setTagInput] = createSignal("");

    const addTag = (tagText: string) => {
        const newTag = tagText.trim();
        if (newTag && !formData().tags?.includes(newTag)) {
            setFormData(prev => ({ 
                ...prev, 
                tags: [...(prev.tags || []), newTag] 
            }));
        }
        setTagInput("");
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ 
            ...prev, 
            tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] 
        }));
    };

    const handleTagKeyPress = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(tagInput());
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
            <Title>Add New Post</Title>
            
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold">Add New Post</h1>
                <Button variant="outline">
                    <A href="/posts">Back to Posts</A>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Post</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createPost} method="post" class="space-y-6">
                        {/* Title Field */}
                        <TextField validationState={errors().title ? "invalid" : "valid"}>
                            <TextFieldLabel>Title *</TextFieldLabel>
                            <TextFieldInput
                                type="text"
                                name="title"
                                value={formData().title}
                                onInput={(e) => updateFormData("title")(e.currentTarget.value)}
                                placeholder="Enter post title"
                                disabled={submission.pending}
                            />
                            <Show when={errors().title}>
                                <TextFieldErrorMessage>{errors().title}</TextFieldErrorMessage>
                            </Show>
                        </TextField>

                        {/* Author Field */}
                        <TextField validationState={errors().author ? "invalid" : "valid"}>
                            <TextFieldLabel>Author *</TextFieldLabel>
                            <TextFieldInput
                                type="text"
                                name="author"
                                value={formData().author}
                                onInput={(e) => updateFormData("author")(e.currentTarget.value)}
                                placeholder="Enter author name"
                                disabled={submission.pending}
                            />
                            <Show when={errors().author}>
                                <TextFieldErrorMessage>{errors().author}</TextFieldErrorMessage>
                            </Show>
                        </TextField>

                        {/* Subheading Field */}
                        <TextField validationState={errors().subheading ? "invalid" : "valid"}>
                            <TextFieldLabel>Subheading *</TextFieldLabel>
                            <TextFieldInput
                                type="text"
                                name="subheading"
                                value={formData().subheading}
                                onInput={(e) => updateFormData("subheading")(e.currentTarget.value)}
                                placeholder="Enter post subheading"
                                disabled={submission.pending}
                            />
                            <Show when={errors().subheading}>
                                <TextFieldErrorMessage>{errors().subheading}</TextFieldErrorMessage>
                            </Show>
                        </TextField>

                        {/* Title Image URL Field */}
                        <TextField validationState={errors().hero_image ? "invalid" : "valid"}>
                            <TextFieldLabel>Title Image URL</TextFieldLabel>
                            <TextFieldInput
                                type="text"
                                name="hero_image"
                                value={formData().hero_image || ""}
                                onInput={(e) => updateFormData("hero_image")(e.currentTarget.value)}
                                placeholder="Enter title image URL (optional)"
                                disabled={submission.pending}
                            />
                            <Show when={errors().hero_image}>
                                <TextFieldErrorMessage>{errors().hero_image}</TextFieldErrorMessage>
                            </Show>
                            <Show when={formData().hero_image?.trim()}>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-600 mb-2">Preview:</p>
                                    <img
                                        src={formData().hero_image}
                                        alt="Title image preview"
                                        class="max-w-xs rounded-lg shadow-sm border"
                                        style="max-height: 200px;"
                                        loading="lazy"
                                    />
                                </div>
                            </Show>
                        </TextField>

                        {/* Tags Field */}
                        <TextField validationState={errors().tags ? "invalid" : "valid"}>
                            <TextFieldLabel>Tags</TextFieldLabel>
                            <div class="space-y-3">
                                <TextFieldInput
                                    type="text"
                                    value={tagInput()}
                                    onInput={(e) => setTagInput(e.currentTarget.value)}
                                    onKeyPress={handleTagKeyPress}
                                    placeholder="Enter a tag and press Enter to add"
                                    disabled={submission.pending}
                                />
                                <input
                                    type="hidden"
                                    name="tags"
                                    value={formData().tags?.join(", ") || ""}
                                />
                                <Show when={formData().tags && formData().tags!.length > 0}>
                                    <div>
                                        <p class="text-sm text-gray-600 mb-2">Tags:</p>
                                        <div class="flex flex-wrap gap-2">
                                            <For each={formData().tags}>
                                                {(tag: string) => (
                                                    <Badge 
                                                        variant="secondary" 
                                                        class="text-sm flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                                                        onClick={() => removeTag(tag)}
                                                    >
                                                        {tag}
                                                        <span class="text-gray-500 hover:text-red-500">×</span>
                                                    </Badge>
                                                )}
                                            </For>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">Click on a tag to remove it</p>
                                    </div>
                                </Show>
                            </div>
                            <Show when={errors().tags}>
                                <TextFieldErrorMessage>{errors().tags}</TextFieldErrorMessage>
                            </Show>
                            <p class="text-sm text-gray-600 mt-1">
                                Type a tag and press Enter to add it to the list
                            </p>
                        </TextField>

                        {/* Body Field */}
                        <div class="space-y-4">
                            <TextField validationState={errors().body ? "invalid" : "valid"}>
                                <TextFieldLabel>Body *</TextFieldLabel>
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <TextFieldTextArea
                                            name="body"
                                            value={formData().body}
                                            onInput={(e) => updateFormData("body")(e.currentTarget.value)}
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
                                            content={formData().body} 
                                            class="h-full"
                                        />
                                    </div>
                                </div>
                            </TextField>
                            
                            {/* Mobile preview - show below editor on smaller screens */}
                            <div class="xl:hidden">
                                <TypstPreview 
                                    content={formData().body} 
                                />
                            </div>
                        </div>

                        {/* Submit Error */}
                        <Show when={errors().submit}>
                            <div class="p-4 bg-red-50 border border-red-200 rounded-md">
                                <p class="text-red-600 text-sm">{errors().submit}</p>
                            </div>
                        </Show>

                        {/* Submit Button */}
                        <div class="flex justify-end space-x-4">
                            <Button type="button" variant="outline" disabled={submission.pending}>
                                <A href="/posts">Cancel</A>
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={submission.pending}
                                class="min-w-[120px]"
                            >
                                {submission.pending ? "Creating..." : "Create Post"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}