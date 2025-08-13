import { For, JSX } from "solid-js";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { Button } from "~/components/ui/button";
import { User } from "~/lib/providers/auth-provider";
import { hasPermission, Permission } from "~/lib/permissions";

interface MainItem {
    title: string,
    href: string,
    icon: JSX.Element,
    requiredPermission?: Permission,
    customPermissionCheck?: (user: User | null) => boolean
}


export interface MainItemsProps {
    items: MainItem[],
    user: User | null
}

export default function MainItems(props: MainItemsProps) {
    // Filter items based on user permissions
    const visibleItems = () => props.items.filter(item => {
        // Use custom permission check if provided
        if (item.customPermissionCheck) {
            return item.customPermissionCheck(props.user);
        }
        
        // Use specific permission check if provided
        if (item.requiredPermission) {
            return hasPermission(props.user, item.requiredPermission);
        }
        
        // Show items that don't require specific permissions
        return true;
    });

    return (
        <SidebarGroup>
            <SidebarGroupContent class="flex flex-col gap-2">

                <SidebarMenu>
                    <For each={visibleItems()}>
                        {(item) => (
                            <SidebarMenuItem >
                                <SidebarMenuButton tooltip={item.title}>
                                    <a class="inline-flex items-start justify-start gap-3 w-full" href={item.href}>
                                        {item.icon}
                                        <span  class="inline">
                                            {item.title}
                                        </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </For>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}