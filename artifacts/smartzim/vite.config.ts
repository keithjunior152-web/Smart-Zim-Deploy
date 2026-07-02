import { defineConfig, build, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://smartzim.vercel.app";

type RouteMeta = {
  title: string;
  description: string;
  canonical?: string;
  robots: string;
  jsonLd?: string;
  ssrPrerender?: boolean;
};

const SITE_NAME = "SmartZim";
const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "SmartZim — ZIMSEC & Cambridge Exam Prep | AI Tutor & Past Papers",
    description:
      "Prepare for ZIMSEC and Cambridge exams with SmartZim. Access thousands of past papers, AI-powered tutoring (ZimTutor), mock exams, and structured study planners. Join students across Zimbabwe today.",
    canonical: `${SITE_ORIGIN}/`,
    robots: "index, follow",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": ORG_ID,
          name: SITE_NAME,
          url: `${SITE_ORIGIN}/`,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_ORIGIN}/opengraph.jpg`,
          },
          description:
            "SmartZim is an educational platform helping Zimbabwean students prepare for ZIMSEC and Cambridge examinations.",
          foundingDate: "2025",
          founder: { "@type": "Person", name: "Keith Kungwara" },
          areaServed: { "@type": "Country", name: "Zimbabwe" },
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_ORIGIN}/#app`,
          name: SITE_NAME,
          url: `${SITE_ORIGIN}/`,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web, iOS, Android",
          description:
            "ZIMSEC and Cambridge exam prep app with past papers, AI-powered tutoring (ZimTutor), mock exams, assignments, and study planning for Zimbabwean students.",
          screenshot: `${SITE_ORIGIN}/opengraph.jpg`,
          author: { "@id": ORG_ID },
          offers: {
            "@type": "Offer",
            price: "2.00",
            priceCurrency: "USD",
            billingIncrement: "P1M",
            description:
              "Monthly subscription plus a one-time $4 registration fee. 7-day free trial available.",
          },
          audience: {
            "@type": "EducationalAudience",
            educationalRole: "student",
            geographicArea: { "@type": "Country", name: "Zimbabwe" },
          },
        },
        {
          "@type": "WebSite",
          "@id": WEBSITE_ID,
          url: `${SITE_ORIGIN}/`,
          name: SITE_NAME,
          publisher: { "@id": ORG_ID },
        },
      ],
    }),
  },
  "/privacy": {
    title: "Privacy Policy — SmartZim",
    description:
      "Read SmartZim's privacy policy to understand how we collect, use and protect your personal data on our ZIMSEC and Cambridge exam preparation platform in Zimbabwe.",
    canonical: `${SITE_ORIGIN}/privacy`,
    robots: "index, follow",
    ssrPrerender: true,
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/privacy`,
      name: `Privacy Policy — ${SITE_NAME}`,
      url: `${SITE_ORIGIN}/privacy`,
      description:
        "SmartZim's privacy policy covering data collection, use, storage and your rights as a user of our Zimbabwean exam prep platform.",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORG_ID },
    }),
  },
  "/terms": {
    title: "Terms of Service — SmartZim",
    description:
      "Read SmartZim's terms of service governing your use of our ZIMSEC and Cambridge exam preparation platform, AI tutor, and educational resources in Zimbabwe.",
    canonical: `${SITE_ORIGIN}/terms`,
    robots: "index, follow",
    ssrPrerender: true,
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/terms`,
      name: `Terms of Service — ${SITE_NAME}`,
      url: `${SITE_ORIGIN}/terms`,
      description:
        "SmartZim terms of service covering acceptable use, subscriptions, content ownership and user responsibilities.",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORG_ID },
    }),
  },
  "/ministry": {
    title: "Ministry of Education Announcements — SmartZim",
    description:
      "Official announcements from Zimbabwe's Ministry of Primary and Secondary Education (MoPSE), curated on SmartZim for students, teachers and parents.",
    canonical: `${SITE_ORIGIN}/ministry`,
    robots: "index, follow",
    ssrPrerender: true,
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/ministry`,
      name: `Ministry of Education Announcements — ${SITE_NAME}`,
      url: `${SITE_ORIGIN}/ministry`,
      description:
        "Official announcements from Zimbabwe's Ministry of Primary and Secondary Education (MoPSE).",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORG_ID },
      about: {
        "@type": "GovernmentOrganization",
        name: "Ministry of Primary and Secondary Education",
        alternateName: "MoPSE",
        url: "https://www.mopse.co.zw",
        areaServed: { "@type": "Country", name: "Zimbabwe" },
      },
    }),
  },
  "/login": {
    title: "Sign In — SmartZim",
    description:
      "Sign in to your SmartZim account to access ZIMSEC and Cambridge exam prep resources.",
    canonical: `${SITE_ORIGIN}/login`,
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Create Account — SmartZim",
    description:
      "Create a SmartZim account to access past papers, AI-powered tutoring, mock exams, and study tools for ZIMSEC and Cambridge.",
    canonical: `${SITE_ORIGIN}/register`,
    robots: "noindex, nofollow",
  },
  "/pending": {
    title: "Account Pending Approval — SmartZim",
    description: "Your SmartZim account is awaiting administrator approval.",
    robots: "noindex, nofollow",
  },
  "/rejected": {
    title: "Registration Not Approved — SmartZim",
    description:
      "Your SmartZim account registration could not be approved at this time.",
    robots: "noindex, nofollow",
  },
};

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJsonLd(json: string): string {
  return json.replace(/<\//g, "<\\/");
}

type MinistryPost = {
  id: number;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  hashtags: string | null;
  isPinned: boolean;
  createdAt: Date | string;
};

const MINISTRY_PUBLISHER = {
  "@type": "GovernmentOrganization",
  name: "Ministry of Primary and Secondary Education",
  alternateName: "MoPSE",
  url: "https://www.mopse.co.zw",
};

// Builds feed-aware structured data for the /ministry route so search
// engines and AI crawlers can understand the page as a dated feed of
// official announcements (freshness, order, publisher) instead of a
// generic WebPage. Falls back to a plain CollectionPage when there is no
// announcement content yet, so the JSON-LD always matches the visible HTML.
function buildMinistryJsonLd(posts: MinistryPost[]): string {
  const pageUrl = `${SITE_ORIGIN}/ministry`;
  const itemListElement = posts.map((post, index) => {
    const createdAt = new Date(post.createdAt).toISOString();
    const headline =
      post.content.length > 110 ? `${post.content.slice(0, 110)}…` : post.content;
    return {
      "@type": "ListItem",
      position: index + 1,
      url: `${pageUrl}#announcement-${post.id}`,
      item: {
        "@type": "NewsArticle",
        "@id": `${pageUrl}#announcement-${post.id}`,
        headline,
        articleBody: post.content,
        datePublished: createdAt,
        dateModified: createdAt,
        url: `${pageUrl}#announcement-${post.id}`,
        image: post.imageUrl ?? undefined,
        video: post.videoUrl ?? undefined,
        isAccessibleForFree: true,
        publisher: MINISTRY_PUBLISHER,
        author: MINISTRY_PUBLISHER,
      },
    };
  });

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: `Ministry of Education Announcements — ${SITE_NAME}`,
    description:
      "Official announcements from Zimbabwe's Ministry of Primary and Secondary Education (MoPSE).",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    about: MINISTRY_PUBLISHER,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: posts.length,
      itemListElement,
    },
  });
}

function replaceHead(html: string, meta: RouteMeta): string {
  let result = html;
  const title = escHtml(meta.title);
  const desc = escHtml(meta.description);

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  result = result.replace(
    /<meta name="description"[^>]*\/>/,
    `<meta name="description" content="${desc}" />`,
  );
  if (meta.canonical) {
    result = result.replace(
      /<link rel="canonical"[^>]*\/>/,
      `<link rel="canonical" href="${meta.canonical}" />`,
    );
  } else {
    result = result.replace(/<link rel="canonical"[^>]*\/>\s*/g, "");
  }
  result = result.replace(
    /<meta name="robots"[^>]*\/>/,
    `<meta name="robots" content="${meta.robots}" />`,
  );
  result = result.replace(
    /<meta property="og:title"[^>]*\/>/,
    `<meta property="og:title" content="${title}" />`,
  );
  result = result.replace(
    /<meta property="og:description"[^>]*\/>/,
    `<meta property="og:description" content="${desc}" />`,
  );
  if (meta.canonical) {
    result = result.replace(
      /<meta property="og:url"[^>]*\/>/,
      `<meta property="og:url" content="${meta.canonical}" />`,
    );
  }
  result = result.replace(
    /<meta name="twitter:title"[^>]*\/>/,
    `<meta name="twitter:title" content="${title}" />`,
  );
  result = result.replace(
    /<meta name="twitter:description"[^>]*\/>/,
    `<meta name="twitter:description" content="${desc}" />`,
  );
  result = result.replace(
    /<meta property="og:image"[^>]*\/>/,
    `<meta property="og:image" content="${SITE_ORIGIN}/opengraph.jpg" />`,
  );
  result = result.replace(
    /<meta name="twitter:image"[^>]*\/>/,
    `<meta name="twitter:image" content="${SITE_ORIGIN}/opengraph.jpg" />`,
  );
  if (meta.jsonLd) {
    result = result.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n    ${safeJsonLd(meta.jsonLd)}\n    </script>`,
    );
  }
  return result;
}

function smartzimSeoPlugin(): Plugin {
  return {
    name: "smartzim-seo",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const routePath = (req.url ?? "/").split("?")[0];
        const meta = ROUTE_META[routePath];
        if (meta && meta.robots === "noindex, nofollow") {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        if (/^\/teachers\/[^/]+/.test(routePath)) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        next();
      });
    },

    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const routePath = ctx?.path ?? "/";
        const meta = ROUTE_META[routePath];
        if (meta) return replaceHead(html, meta);
        return html;
      },
    },

    async closeBundle() {
      const ctx = this as unknown as { meta?: { watchMode?: boolean } };
      if (ctx.meta?.watchMode) return;

      const artifactDir = path.resolve(import.meta.dirname);
      const outDir = path.resolve(artifactDir, "dist/public");
      const baseHtmlPath = path.join(outDir, "index.html");
      if (!existsSync(baseHtmlPath)) return;

      const serverOutDir = path.resolve(artifactDir, "dist/server");

      // Vite's transformIndexHtml hook does not reliably fire for the root
      // HTML entry during a production build, so the checked-in index.html
      // must be normalized to SITE_ORIGIN explicitly here before it is used
      // as the shared template for every other generated page.
      const rootMeta = ROUTE_META["/"];
      const baseHtml = rootMeta
        ? replaceHead(readFileSync(baseHtmlPath, "utf-8"), rootMeta)
        : readFileSync(baseHtmlPath, "utf-8");
      writeFileSync(baseHtmlPath, baseHtml);
      for (const [route, meta] of Object.entries(ROUTE_META)) {
        if (route === "/" || meta.ssrPrerender) continue;
        const routeSlug = route.replace(/^\//, "");
        const routeDir = path.join(outDir, routeSlug);
        mkdirSync(routeDir, { recursive: true });
        writeFileSync(
          path.join(routeDir, "index.html"),
          replaceHead(baseHtml, meta),
        );
      }

      await build({
        configFile: false,
        root: artifactDir,
        base: "/",
        plugins: [react()],
        resolve: {
          alias: { "@": path.resolve(artifactDir, "src") },
          dedupe: ["react", "react-dom"],
        },
        build: {
          ssr: true,
          outDir: serverOutDir,
          emptyOutDir: true,
          rollupOptions: {
            input: path.resolve(artifactDir, "src/entry-server.tsx"),
            output: { format: "esm" },
          },
        },
        logLevel: "warn",
      });

      const serverEntry = await import(
        path.join(serverOutDir, "entry-server.js") + "?t=" + Date.now()
      );

      const landingHtml: string = serverEntry.render();
      writeFileSync(
        baseHtmlPath,
        baseHtml.replace(
          '<div id="root"></div>',
          `<div id="root">${landingHtml}</div>`,
        ),
      );

      // The ministry announcements page is an indexed route, so its
      // prerendered HTML must contain the real announcement content rather
      // than falling back to a "no announcements yet" empty state. Query the
      // database directly (the same source of truth the API route reads
      // from) instead of making a best-effort HTTP call to a local API
      // server that is not running during a static Vercel build. The query
      // itself lives in entry-server.tsx's fetchMinistryPosts() so it runs
      // inside the already-bundled SSR module graph, where Vite resolves
      // extensionless workspace-package imports; calling it directly from
      // this config file hits Node's native ESM loader, which cannot. If
      // the database is unreachable or the query fails, fail the build
      // outright so an empty-state HTML file is never published as the
      // canonical indexed page for this route.
      let ministryPosts: MinistryPost[];
      try {
        ministryPosts = await serverEntry.fetchMinistryPosts();
      } catch (err) {
        throw new Error(
          `Failed to fetch ministry announcements from the database during build. ` +
            `The /ministry route is a canonical indexed page and must not be published ` +
            `with empty content. Original error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const ministryMeta: RouteMeta = {
        ...ROUTE_META["/ministry"],
        jsonLd: buildMinistryJsonLd(ministryPosts),
      };
      const routeMetaForPrerender: Record<string, RouteMeta> = {
        ...ROUTE_META,
        "/ministry": ministryMeta,
      };

      const ssrRouteMap: Record<string, () => string> = {
        "/privacy": () => serverEntry.renderPrivacy(),
        "/terms": () => serverEntry.renderTerms(),
        "/ministry": () => serverEntry.renderMinistry(ministryPosts),
      };

      for (const [route, meta] of Object.entries(routeMetaForPrerender)) {
        if (!meta.ssrPrerender) continue;
        const renderFn = ssrRouteMap[route];
        if (!renderFn) continue;
        const bodyHtml: string = renderFn();
        const routeSlug = route.replace(/^\//, "");
        const routeDir = path.join(outDir, routeSlug);
        mkdirSync(routeDir, { recursive: true });
        const headReplaced = replaceHead(baseHtml, meta);
        writeFileSync(
          path.join(routeDir, "index.html"),
          headReplaced.replace(
            '<div id="root"></div>',
            `<div id="root">${bodyHtml}</div>`,
          ),
        );
      }

      const teachersMeta: RouteMeta = {
        title: "Teacher Profiles — SmartZim",
        description:
          "Browse teacher profiles on SmartZim, Zimbabwe's ZIMSEC and Cambridge exam prep platform.",
        robots: "noindex, nofollow",
      };
      const teachersDir = path.join(outDir, "teachers");
      mkdirSync(teachersDir, { recursive: true });
      writeFileSync(
        path.join(teachersDir, "index.html"),
        replaceHead(baseHtml, teachersMeta),
      );

      // Normalize any other canonical host baked into static crawl files
      // (robots.txt, sitemap.xml, llms.txt) to the same SITE_ORIGIN used above,
      // so every crawl-facing surface points at one host regardless of what
      // literal domain is checked into the public/ source files.
      const HOST_PATTERN = /https:\/\/smartzim\.(replit|vercel)\.app/g;
      for (const filename of ["robots.txt", "sitemap.xml", "llms.txt"]) {
        const filePath = path.join(outDir, filename);
        if (!existsSync(filePath)) continue;
        const contents = readFileSync(filePath, "utf-8");
        const normalized = contents.replace(HOST_PATTERN, SITE_ORIGIN);
        if (normalized !== contents) writeFileSync(filePath, normalized);
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_SITE_ORIGIN": JSON.stringify(SITE_ORIGIN),
  },
  plugins: [
    react(),
    tailwindcss(),
    smartzimSeoPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "offline.html"],
      manifest: {
        name: "SmartZim Learning",
        short_name: "SmartZim",
        description:
          "ZIMSEC & Cambridge learning for Zimbabwe — AI tutor, past papers, notes, and more. Works offline.",
        id: basePath,
        start_url: basePath,
        scope: basePath,
        display: "standalone",
        orientation: "portrait",
        background_color: "#fdf6ec",
        theme_color: "#1a6b3c",
        lang: "en",
        categories: ["education"],
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
