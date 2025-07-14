import { defineConfig } from "@solidjs/start/config";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { macaronVitePlugin } from "@macaron-css/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  vite: {
    plugins: [
      macaronVitePlugin()
    ],
    resolve: {
      alias: {
        $lib: join(__dirname, "src/lib"),
        $components: join(__dirname, "src/components"),
        $api: join(__dirname, "./.gen")
      },
    },
  },
});