import { A, createAsync, query, redirect, RouteDefinition, useNavigate } from "@solidjs/router";
import { getCurrentUserQuery, useAuthSafe } from "~/lib/providers/auth-provider";
import { createEffect, createMemo, createSignal, For, JSX, onMount, Show, Suspense } from "solid-js";
import { AppSidebar } from "~/components/app-sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { SiteHeader } from "~/components/site-header";
import { usePageinfo } from "~/lib/providers/pageinfo-provider";

export const route = {
  preload: () => { getCurrentUserQuery(); }
} satisfies RouteDefinition;

export default function AppLayout(props: any) {
  const auth = useAuthSafe();

  

  return (
    <>

      <SidebarProvider style={
        {

          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as JSX.CSSProperties
      }>
        <Suspense>
          <Show when={auth?.user()}>
            {(st) =>
              <>
                <AppSidebar variant="inset" user={st()} />
                <SidebarInset class="flex flex-col w-full ">
                  <SiteHeader></SiteHeader>

                  <div class="flex-1  p-2 w-full">
                    {props.children}
                  </div>


                </SidebarInset>
              </>
            }
          </Show>
        </Suspense>

      </SidebarProvider>
    </>
  );
}
