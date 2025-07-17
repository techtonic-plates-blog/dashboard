import { Accessor, createContext, createEffect, createSignal, onMount, useContext } from "solid-js";
import { useLocation } from "@solidjs/router";


interface PageinfoProviderState {
    pageDesc: Accessor<string>,
    setUsePathForDesc: (set: boolean) => void,
    setPageDesc: (desc: string) => void,
    refreshPageInfo: () => void
}

const PageinfoContext = createContext<PageinfoProviderState>();

export interface PageinfoProviderProps {
    children: any,
    useTitleForDesc: boolean,
    initialDesc: string
}

export default function PageinfoProvider(props: PageinfoProviderProps) {
    const [pageDesc, setPageDesc] = createSignal(props.initialDesc);
    const [usePathForDesc, setUsePathForDesc] = createSignal(props.useTitleForDesc);
    const location = useLocation();

    // Effect that runs on navigation changes
    createEffect(() => {
        // location.pathname will trigger this effect when navigation occurs
        const currentPath = location.pathname;
        console.log("Navigation occurred to:", currentPath);

        // Always reset to initial desc on navigation, then conditionally update

        if (usePathForDesc()) {
            setPageDesc(currentPath);
        }
    });

    onMount(() => {

        const currentPath = location.pathname;
        if (usePathForDesc()) {
            setPageDesc(currentPath)
        }
    })

    const refreshPageInfo = () => {
        if (usePathForDesc()) {
            setPageDesc(document.title);
        } else {
            setPageDesc(props.initialDesc);
        }
    };

    const providerValue = {
        pageDesc: pageDesc,
        setUsePathForDesc: (set: boolean) => setUsePathForDesc(set),
        setPageDesc: (desc: string) => setPageDesc(desc),
        refreshPageInfo: refreshPageInfo
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