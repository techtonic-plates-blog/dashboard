import { A, createAsync, query, redirect, RouteDefinition, useNavigate } from "@solidjs/router";
import { useAuthSafe } from "~/lib/providers/auth-provider";
import { createEffect, createMemo, createSignal, For, JSX, onMount, Show, Suspense } from "solid-js";
import { AppSidebar } from "~/components/app-sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { SiteHeader } from "~/components/site-header";
import { usePageinfo } from "~/lib/providers/pageinfo-provider";
import { useSession } from "~/lib/session";


const appAuthQuery = query(async () => {
  "use server";
  const session = await useSession();
  if (!session.data?.user) {
    throw redirect("/login")
  }
  return session.data.user;
}, "appAuthQuery");

export const route = {
  preload: () => { appAuthQuery(); }
} satisfies RouteDefinition;

export default function AppLayout(props: any) {
  const auth = useAuthSafe();
  const authStatus = createAsync(() => appAuthQuery());

  // Sync auth provider state with session
  createEffect(() => {
    const userData = authStatus();
    if (userData && auth && !auth.isAuthenticated()) {
      // Update auth provider state if session has user but provider doesn't
      auth.refreshUser();
    }
  });


  return (
    <>

      <SidebarProvider style={
        {

          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as JSX.CSSProperties
      }>
        <Suspense>
          <Show when={authStatus()}>
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
