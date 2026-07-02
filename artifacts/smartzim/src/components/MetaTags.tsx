import { useEffect } from "react";

interface MetaTagsProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

// Single source of truth for the canonical host: injected from the same
// SITE_ORIGIN env var used by the build-time prerender config in vite.config.ts,
// so the client-mutated head always agrees with the static HTML shell and
// prerendered pages.
const CANONICAL_BASE: string =
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined) ??
  "https://smartzim.vercel.app";

function getMeta(selector: string): HTMLMetaElement | null {
  return document.querySelector(selector) as HTMLMetaElement | null;
}

function getLink(rel: string): HTMLLinkElement | null {
  return document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
}

export function MetaTags({ title, description, canonical, noindex = false }: MetaTagsProps) {
  useEffect(() => {
    const prev = {
      title: document.title,
      description: getMeta('meta[name="description"]')?.content,
      canonical: getLink("canonical")?.href,
      robots: getMeta('meta[name="robots"]')?.content,
      ogTitle: getMeta('meta[property="og:title"]')?.content,
      ogDesc: getMeta('meta[property="og:description"]')?.content,
      ogUrl: getMeta('meta[property="og:url"]')?.content,
      twitterTitle: getMeta('meta[name="twitter:title"]')?.content,
      twitterDesc: getMeta('meta[name="twitter:description"]')?.content,
    };

    if (title) {
      document.title = title;
      const ogTitle = getMeta('meta[property="og:title"]');
      if (ogTitle) ogTitle.content = title;
      const twitterTitle = getMeta('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.content = title;
    }

    if (description) {
      const descEl = getMeta('meta[name="description"]');
      if (descEl) descEl.content = description;
      const ogDesc = getMeta('meta[property="og:description"]');
      if (ogDesc) ogDesc.content = description;
      const twitterDesc = getMeta('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.content = description;
    }

    if (canonical) {
      const canonicalEl = getLink("canonical");
      if (canonicalEl) canonicalEl.href = `${CANONICAL_BASE}${canonical}`;
      const ogUrl = getMeta('meta[property="og:url"]');
      if (ogUrl) ogUrl.content = `${CANONICAL_BASE}${canonical}`;
    }

    const robotsEl = getMeta('meta[name="robots"]');
    if (noindex) {
      if (robotsEl) robotsEl.content = "noindex, nofollow";
    }

    return () => {
      document.title = prev.title;

      const descEl = getMeta('meta[name="description"]');
      if (descEl && prev.description !== undefined) descEl.content = prev.description;

      const canonicalEl = getLink("canonical");
      if (canonicalEl && prev.canonical !== undefined) canonicalEl.href = prev.canonical;

      const robotsElCleanup = getMeta('meta[name="robots"]');
      if (robotsElCleanup && prev.robots !== undefined) robotsElCleanup.content = prev.robots;

      const ogTitleEl = getMeta('meta[property="og:title"]');
      if (ogTitleEl && prev.ogTitle !== undefined) ogTitleEl.content = prev.ogTitle;

      const ogDescEl = getMeta('meta[property="og:description"]');
      if (ogDescEl && prev.ogDesc !== undefined) ogDescEl.content = prev.ogDesc;

      const ogUrlEl = getMeta('meta[property="og:url"]');
      if (ogUrlEl && prev.ogUrl !== undefined) ogUrlEl.content = prev.ogUrl;

      const twitterTitleEl = getMeta('meta[name="twitter:title"]');
      if (twitterTitleEl && prev.twitterTitle !== undefined) twitterTitleEl.content = prev.twitterTitle;

      const twitterDescEl = getMeta('meta[name="twitter:description"]');
      if (twitterDescEl && prev.twitterDesc !== undefined) twitterDescEl.content = prev.twitterDesc;
    };
  }, [title, description, canonical, noindex]);

  return null;
}
