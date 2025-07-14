import { Accessor, createContext, createEffect, createSignal, onMount, useContext } from "solid-js";
import { useLocation } from "@solidjs/router";


interface PageinfoProviderState {
    pageDesc: Accessor<string>,
    setUseTitleForDesc: (set: boolean) => void
}

const PageinfoContext = createContext<PageinfoProviderState>();

export interface PageinfoProviderProps {
    children: any,
    useTitleForDesc: boolean,
    initialDesc: string
}

export default function PageinfoProvider(props: PageinfoProviderProps) {
    const [pageDesc, setPageDesc] = createSignal(props.initialDesc);
    const [useTitleForDesc, setUseTitleForDesc] = createSignal(props.useTitleForDesc);
    const location = useLocation();

    // Effect that runs on navigation changes
    createEffect(() => {
        // location.pathname will trigger this effect when navigation occurs
        const currentPath = location.pathname;
        //console.log("Navigation occurred to:", currentPath);
        
        if (useTitleForDesc()) {
            setPageDesc(document.title);
        }
    });

    onMount(() => {
        if (useTitleForDesc()) {
            setPageDesc(document.title)
        }
    })

    const providerValue = {
        pageDesc: pageDesc,
        setUseTitleForDesc: (set: boolean) => setUseTitleForDesc(set)
    };

    return (
        <PageinfoContext.Provider value={providerValue}>
            {props.children}
        </PageinfoContext.Provider>
    )
}

export function usePageinfo(): PageinfoProviderState {
    const ctx = useContext(PageinfoContext);

    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return ctx;
}