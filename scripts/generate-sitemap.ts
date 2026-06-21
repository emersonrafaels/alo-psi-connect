// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://redebemestar.com.br";
const SUPABASE_URL = "https://mbuljmpamdocnxppueww.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWxqbXBhbWRvY254cHB1ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTMxNzUsImV4cCI6MjA3MTU4OTE3NX0.byP_5kv4bwOSpenNl0giMneBNv7396XjWkFMOwc_ttY";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/sobre", changefreq: "monthly", priority: "0.8" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/profissionais", changefreq: "weekly", priority: "0.9" },
  { path: "/praticas", changefreq: "weekly", priority: "0.8" },
  { path: "/agendar", changefreq: "weekly", priority: "0.8" },
  { path: "/contato", changefreq: "monthly", priority: "0.7" },
  { path: "/trabalhe-conosco", changefreq: "monthly", priority: "0.6" },
  { path: "/cadastro/tipo-usuario", changefreq: "monthly", priority: "0.6" },
  { path: "/politica-privacidade", changefreq: "yearly", priority: "0.3" },
  { path: "/termos-servico", changefreq: "yearly", priority: "0.3" },
];

async function fetchBlogEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .limit(1000);
    if (error || !data) {
      console.warn("sitemap: failed to fetch blog posts", error?.message);
      return [];
    }
    return data.map((p: any) => ({
      path: `/blog/${p.slug}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch (e: any) {
    console.warn("sitemap: blog fetch threw", e?.message);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const blog = await fetchBlogEntries();
  const entries = [...staticEntries, ...blog];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
