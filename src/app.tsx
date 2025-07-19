import { MetaProvider } from "@solidjs/meta";
import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createEffect, createSignal, onMount, ParentProps, Suspense } from "solid-js";

import "./app.css"
import { AuthProvider } from "./lib/providers/auth-provider";
import { isServer } from "solid-js/web"
import { getCookie } from "vinxi/http"

import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from "@kobalte/core"
import PageinfoProvider from "./lib/providers/pageinfo-provider";

function getServerCookies() {
  "use server"
  const colorMode = getCookie("kb-color-mode")
  return colorMode ? `kb-color-mode=${colorMode}` : "kb-color-mode=system"
}

function RootLayout(props: ParentProps) {
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie)

  return (
    <MetaProvider>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <Suspense fallback={<div>Loading application...</div>}>
          <AuthProvider>
            <Suspense >
              <PageinfoProvider useTitleForDesc={true} initialDesc="Home">
                {props.children}
              </PageinfoProvider>
            </Suspense>
          </AuthProvider>
        </Suspense>
      </ColorModeProvider>
    </MetaProvider>
  );
}

export default function App() {
  return (
    <Router root={RootLayout}>
      <FileRoutes />
    </Router>
  );
}
