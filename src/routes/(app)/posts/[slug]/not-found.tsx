import { Title } from "@solidjs/meta";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { A, useParams } from "@solidjs/router";

export default function PostNotFound() {
    const params = useParams();

    return (
        <section class="w-full max-w-none p-6">
            <Title>Post Not Found</Title>

            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold">Post Not Found</h1>
                <Button variant="outline">
                    <A href="/posts">Back to Posts</A>
                </Button>
            </div>

            <Card class="max-w-2xl mx-auto">
                <CardHeader class="text-center">
                    <CardTitle class="text-2xl text-red-600">404 - Post Not Found</CardTitle>
                </CardHeader>
                <CardContent class="text-center space-y-6">
                    <div class="space-y-3">
                        <p class="text-gray-600">
                            The post with slug <code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{params.slug}</code> could not be found.
                        </p>
                        <p class="text-gray-600">
                            It may have been deleted, moved, or never existed.
                        </p>
                    </div>

                    <div class="flex justify-center space-x-4">
                        <Button variant="outline">
                            <A href="/posts">View All Posts</A>
                        </Button>
                        <Button>
                            <A href="/posts/new">Create New Post</A>
                        </Button>
                    </div>

                    <div class="pt-4 border-t">
                        <p class="text-sm text-gray-500">
                            If you believe this is an error, please contact the administrator.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
