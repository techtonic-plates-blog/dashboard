import { JSX } from "solid-js"

interface SecondaryItem {
    title: string,
    href: string,
    icon: JSX.Element
}


export interface SecondaryItemsProps {
    items: SecondaryItem[]
}

export default function SecondaryItems() {

}