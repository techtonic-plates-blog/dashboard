import { For, JSX } from "solid-js";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { Button } from "~/components/ui/button";

interface MainItem {
    title: string,
    href: string,
    icon: JSX.Element
}


export interface MainItemsProps {
    items: MainItem[]
}

export default function MainItems(props: MainItemsProps) {

    return (
        <SidebarGroup>
            <SidebarGroupContent class="flex flex-col gap-2">

                <SidebarMenu>
                    <For each={props.items}>
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