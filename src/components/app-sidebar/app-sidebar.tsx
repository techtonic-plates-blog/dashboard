

import { Brain, Camera, Database, File, FileText, Film, HelpCircle, LayoutDashboard, Pencil, Search, Settings, Text } from "lucide-solid"
import { Accessor, ComponentProps, JSX, Show } from "solid-js"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import MainItems, { MainItemsProps } from "./main-items"
import { useAuth, User } from "~/lib/providers/auth-provider"
import UserItem from "./user-item"


const navItems = {
  mainItems: {
    items: [
      /* {
         title: "Stories",
         href: "/stories",
         icon: <Text></Text>
       },
       {
         title: "Videos",
         href: "/videos",
         icon: <Film></Film>
       }*/
      {
        title: "Posts",
        href: "/posts",
        icon: <FileText></FileText>
      }
    ]
  } satisfies MainItemsProps
}

export interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  user: User
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  //const { user } = useAuth();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton

              class="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <span class="text-base font-semibold">Story Time</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <MainItems items={navItems.mainItems.items}></MainItems>
      </SidebarContent>
      <SidebarFooter>

          <UserItem username={props.user.username!}></UserItem>
      
      </SidebarFooter>
    </Sidebar>
  )
}
