import { renderToString } from "react-dom/server";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import type { SocialPost } from "@workspace/api-client-react";
import Landing from "./pages/public/Landing";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import MinistryAnnouncements from "./pages/social/MinistryAnnouncements";

const MINISTRY_QUERY_KEY = ["/api/social/ministry-announcements"] as const;

function makeStaticHook(path: string): () => [string, (p: string) => void] {
  return () => [path, (_p: string) => {}];
}

function makeQc(seedData?: { key: readonly string[]; data: unknown }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false, staleTime: Infinity },
    },
  });
  if (seedData) {
    qc.setQueryData([...seedData.key], seedData.data);
  }
  return qc;
}

export function render(): string {
  return renderToString(
    <QueryClientProvider client={makeQc()}>
      <Router hook={makeStaticHook("/")}>
        <Landing />
      </Router>
    </QueryClientProvider>
  );
}

export function renderPrivacy(): string {
  return renderToString(
    <QueryClientProvider client={makeQc()}>
      <Router hook={makeStaticHook("/privacy")}>
        <Privacy />
      </Router>
    </QueryClientProvider>
  );
}

export function renderTerms(): string {
  return renderToString(
    <QueryClientProvider client={makeQc()}>
      <Router hook={makeStaticHook("/terms")}>
        <Terms />
      </Router>
    </QueryClientProvider>
  );
}

export function renderMinistry(posts?: SocialPost[]): string {
  const qc = makeQc(
    posts !== undefined
      ? { key: MINISTRY_QUERY_KEY, data: posts }
      : undefined,
  );
  return renderToString(
    <QueryClientProvider client={qc}>
      <Router hook={makeStaticHook("/ministry")}>
        <MinistryAnnouncements />
      </Router>
    </QueryClientProvider>
  );
}
