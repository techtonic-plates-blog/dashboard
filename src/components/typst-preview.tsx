import { createEffect, createSignal, Show, ErrorBoundary } from "solid-js";
import { useAction } from "@solidjs/router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Eye, EyeOff, RefreshCw } from "lucide-solid";
import { compileTypstAction } from "~/lib/typst-compiler";
import "~/components/styles/typst-scoped.css";

interface TypstPreviewProps {
    content: string;
    class?: string;
}

export function TypstPreview(props: TypstPreviewProps) {
    const [isVisible, setIsVisible] = createSignal(true);
    const [previewHtml, setPreviewHtml] = createSignal<string>("");
    const [error, setError] = createSignal<string | null>(null);
    const [isCompiling, setIsCompiling] = createSignal(false);
    
    const compileAction = useAction(compileTypstAction);
    createEffect(() => {
        if (props.content) {
            compileTypst(props.content);
        }
    });
    
    const compileTypst = async (content: string) => {
        if (!content.trim()) {
            setPreviewHtml("");
            setError(null);
            return;
        }

        setIsCompiling(true);
        setError(null);

        try {
            const result = await compileAction(content);
            
            if (result.success) {
                setPreviewHtml(result.html || "");
            } else {
                setError(result.error || "Unknown compilation error");
                setPreviewHtml("");
            }
        } catch (err: any) {
            console.error("Typst compilation error:", err);
            setError(err);
            setPreviewHtml("");
        } finally {
            setIsCompiling(false);
        }
    };

  
    const forceRecompile = () => {
        compileTypst(props.content);
    };

    return (
        <Card class={props.class}>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle class="text-base font-medium">
                    Typst Preview
                    <Show when={isCompiling()}>
                        <RefreshCw class="inline ml-2 h-4 w-4 animate-spin" />
                    </Show>
                </CardTitle>
                <div class="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={forceRecompile}
                        disabled={isCompiling()}
                        class="h-8 w-8 p-0"
                        title="Force recompile"
                    >
                        <RefreshCw class="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(prev => !prev)}
                        class="h-8 w-8 p-0"
                        title={isVisible() ? "Hide preview" : "Show preview"}
                    >
                        {isVisible() ? <EyeOff class="h-4 w-4" /> : <Eye class="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            <Show when={isVisible()}>
                <CardContent class="max-h-[500px] overflow-y-auto">
                    <ErrorBoundary 
                        fallback={(err, reset) => (
                            <div class="p-4 text-center">
                                <p class="text-red-600 text-sm mb-2">Preview Error: {err.message}</p>
                                <Button onClick={reset} size="sm" variant="outline">
                                    Try Again
                                </Button>
                            </div>
                        )}
                    >
                        <Show 
                            when={!error()} 
                            fallback={
                                <div class="p-4 bg-red-50 border border-red-200 rounded-md">
                                    <p class="text-red-600 text-sm">{error()}</p>
                                    <Button 
                                        onClick={forceRecompile} 
                                        size="sm" 
                                        variant="outline" 
                                        class="mt-2"
                                    >
                                        Retry Compilation
                                    </Button>
                                </div>
                            }
                        >
                            <Show 
                                when={previewHtml()} 
                                fallback={
                                    <div class="p-8 text-center text-gray-500">
                                        <p class="text-sm">Start typing Typst content to see preview...</p>
                                    </div>
                                }
                            >
                                <div 
                                    class="typst-content" 
                                    innerHTML={previewHtml()}
                                />
                            </Show>
                        </Show>
                    </ErrorBoundary>
                </CardContent>
            </Show>
        </Card>
    );
}
