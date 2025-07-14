import { MetaProvider, Title } from "@solidjs/meta";

import { createAsync, query, RouteSectionProps } from "@solidjs/router";
import { postsClient } from "~/lib/client";
import { createEffect, createResource, For, Match, Show, Suspense, Switch, ErrorBoundary, JSX } from "solid-js";
import { Card, CardHeader, CardContent, CardTitle } from "$components/ui/card";
import { FileText, Library, LibraryBig, Video } from "lucide-solid";

const postsQuery = query(async () => {
  "use server";

  const { data, response } = await postsClient.GET("/posts", {
    params: {
      query: {
        add_count: true,
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!data) {
    const err = await response.text();
    throw new Error(`Failed to fetch posts: ${err}`);
  }

  return data;

}, "postsQuery");

export const route = {
  preload: () => {
    postsQuery();
  }
}

export default function Home() {

  const posts = createAsync(() => postsQuery());

  return (
    <div class="h-screen bg-background">
      <Title>Home</Title>
      <ErrorBoundary fallback={(err, reset) => (
        <div class="p-4">
          <p class="text-error">Error: {err.message}</p>
          <button onClick={reset} class="mt-2">Try Again</button>
        </div>
      )}>
        <Suspense>
          <div class="flex flex-row w-full gap-3">
            <Show when={posts()}>
              {(p) => 
                <TipCard title="Ammount of posts" icon={<FileText></FileText>} mainText={`${p().count!}`}></TipCard>
              }
            </Show>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

interface TipCardProps {
  title: string;
  icon: JSX.Element;
  mainText: string;
  subtext?: string; // Using ? makes it optional
  class?: string; // Optional className
}

function TipCard(props: TipCardProps) {
  const finalClass = props.class ?? ""; // Default value if class is not provided

  return (
    <Card class={finalClass}>
      <CardHeader class="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{props.title}</CardTitle>
        {props.icon}
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{props.mainText}</div>
        <Show when={props.subtext}>
          <p class="text-xs text-muted-foreground">{props.subtext}</p>
        </Show>
      </CardContent>
    </Card>
  )
}