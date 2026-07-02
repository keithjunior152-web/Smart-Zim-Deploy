import { renderToString } from "react-dom/server";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import Landing from "./pages/public/Landing";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import MinistryAnnouncements from "./pages/social/MinistryAnnouncements";

const MINISTRY_QUERY_KEY = ["/api/social/ministry-announcements"] as const;

// Matches the shape of rows returned by the build-time database query in
// vite.config.ts as well as the live /api/social/ministry-announcements
// response, so this file has no build-only dependency on @workspace/db.
export type MinistrySeedPost = {
  id: number;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  hashtags: string | null;
  isPinned: boolean;
  createdAt: Date | string;
};

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

// Runs inside the SSR bundle produced by vite.config.ts's closeBundle build
// step, so relative/extensionless workspace-package imports (e.g.
// "@workspace/db" re-exporting "./schema") are resolved by Vite's own
// module graph instead of Node's native ESM loader, which cannot resolve
// extensionless directory imports on its own.
export async function fetchMinistryPosts(): Promise<MinistrySeedPost[]> {
  const [{ db, socialPosts, users }, { eq, and, desc }] = await Promise.all([
    import("@workspace/db"),
    import("drizzle-orm"),
  ]);
  return db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      imageUrl: socialPosts.imageUrl,
      videoUrl: socialPosts.videoUrl,
      hashtags: socialPosts.hashtags,
      isPinned: socialPosts.isPinned,
      createdAt: socialPosts.createdAt,
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.authorId, users.id))
    .where(
      and(eq(socialPosts.postType, "ministry"), eq(users.isSuperAdmin, true)),
    )
    .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
    .limit(30);
}

export function renderMinistry(posts?: MinistrySeedPost[]): string {
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
