import { action } from "@solidjs/router";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";

export const compileTypstAction = action(async (content: string) => {
    "use server";
    
    if (!content.trim()) {
        return { success: true, html: "" };
    }

    try {
        const compiler = NodeCompiler.create();
        const htmlObject = compiler.tryHtml({
            mainFileContent: content
        });

        const body = htmlObject.result?.body();
        if (!body) {
            let err = htmlObject.takeError()?.shortDiagnostics;
            console.log(err)
            let error: string | null = null;
            if (err) {
                error = "";
                err.map(e => {
                    console.log(e)
                    error += e.message.toString() + "\n";
                });
            }
            return { 
                success: false, 
                error: error || "Failed to compile Typst content"
            };
        }

        return { 
            success: true, 
            html: body 
        };
    } catch (err: any) {
        console.error("Typst compilation error:", err);
        return { 
            success: false, 
            error: err instanceof Error ? err.message : err.toString() ? err.toString() : "Typst compilation error"
        };
    }
}, "compileTypst");
