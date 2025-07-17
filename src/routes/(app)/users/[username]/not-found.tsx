import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export default function UserNotFound() {
    const params = useParams();

    return (
        <section class="w-full px-4 py-8">
            <Title>User Not Found</Title>
            <Card class="p-8 text-center max-w-md mx-auto">
                <div class="mb-6">
                    <div class="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span class="text-3xl text-gray-500">?</span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
                    <p class="text-gray-600 mb-4">
                        The user "{params.username}" could not be found.
                    </p>
                    <p class="text-sm text-gray-500">
                        This user may have been deleted, renamed, or may never have existed.
                    </p>
                </div>
                <div class="flex gap-2 justify-center">
                    <Button>
                        <A href="/users">← Back to Users</A>
                    </Button>
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </Card>
        </section>
    );
}
