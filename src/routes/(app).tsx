import { A, createAsync, query, redirect, RouteDefinition, useNavigate } from "@solidjs/router";
import { protectRoute } from "$lib/auth-actions";
import { createEffect, createMemo, createSignal, For, JSX, onMount, Show, Suspense } from "solid-js";
import { AppSidebar } from "~/components/app-sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { SiteHeader } from "~/components/site-header";
import { usePageinfo } from "~/lib/providers/pageinfo-provider";

export const route = {
  preload: () => { protectRoute(); }
} satisfies RouteDefinition;

export default function AppLayout(props: any) {
  const user = createAsync(() => protectRoute());

  

  return (
    <>

      <SidebarProvider style={
        {

          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as JSX.CSSProperties
      }>
        <Suspense>
          <Show when={user()}>
            {(u) =>
              <>
                <AppSidebar variant="inset" user={u()} />
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
