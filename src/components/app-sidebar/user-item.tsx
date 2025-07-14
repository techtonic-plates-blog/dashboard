import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "../ui/sidebar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup } from "../ui/dropdown-menu"
import { EllipsisVertical, LogOut } from "lucide-solid"
import { useAuth } from "~/lib/providers/auth-provider"
import { redirect, useNavigate } from "@solidjs/router"

interface UserItemProps {
  username: string
}

export default function UserItem(props: UserItemProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const logoutClick = async () => {
    await logout();
    navigate("/login")
  }


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger class="w-full">
            <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
            >

              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{props.username}</span>

              </div>
              <EllipsisVertical class="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"

          >
            <DropdownMenuLabel class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">

                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{props.username}</span>

                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem >
              <button class="flex flex-row gap-3" onclick={logoutClick}><LogOut />
                Log out</button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}