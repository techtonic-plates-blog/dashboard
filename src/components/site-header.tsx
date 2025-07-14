import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { usePageinfo } from "~/lib/providers/pageinfo-provider";

export function SiteHeader() {
  const { pageDesc } = usePageinfo();
  return (
    <header class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger class="-ml-1" />
        <Separator
          orientation="vertical"
          class="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 class="text-base font-medium">{pageDesc()}</h1>
        <div class="ml-auto flex items-center gap-2">
          <ModeToggle></ModeToggle>
        </div>
      </div>
    </header>
  )
}
