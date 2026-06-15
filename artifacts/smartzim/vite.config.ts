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

      const baseHtml = readFileSync(baseHtmlPath, "utf-8");
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
      const landingTemplate = readFileSync(baseHtmlPath, "utf-8");
      writeFileSync(
        baseHtmlPath,
        landingTemplate.replace(
          '<div id="root"></div>',
          `<div id="root">${landingHtml}</div>`,
        ),
      );

      type MinistryPost = Record<string, unknown>;
      let ministryPosts: MinistryPost[] | undefined;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 5000);
        const apiRes = await fetch(
          `${process.env.VITE_API_BASE_URL ?? "http://localhost:3001"}/api/social/ministry-announcements`,
          { signal: controller.signal },
        );
        clearTimeout(tid);
        if (apiRes.ok) {
          ministryPosts = (await apiRes.json()) as MinistryPost[];
        }
      } catch {
        // API not reachable during build; /ministry renders static shell.
      }

      const ssrRouteMap: Record<string, () => string> = {
        "/privacy": () => serverEntry.renderPrivacy(),
        "/terms": () => serverEntry.renderTerms(),
        "/ministry": () => serverEntry.renderMinistry(ministryPosts),
      };

      for (const [route, meta] of Object.entries(ROUTE_META)) {
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
    },
  };
}

export default defineConfig({
  base: basePath,
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
