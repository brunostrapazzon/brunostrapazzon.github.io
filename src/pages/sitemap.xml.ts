import { pageProjects } from "../data/index";

const site = "https://brunostrapazzon.github.io";
export function GET() {
  const pairs: [string, string][] = [["/", "/en/"], ...pageProjects.map((p) => [`/projetos/${p.slug}/`, `/en/projects/${p.slug}/`] as [string, string])];
  const url = (loc: string, pt: string, en: string) =>
    `<url><loc>${site}${loc}</loc><xhtml:link rel="alternate" hreflang="pt-BR" href="${site}${pt}"/><xhtml:link rel="alternate" hreflang="en" href="${site}${en}"/></url>`;
  const body = pairs.map(([pt, en]) => url(pt, pt, en) + url(en, pt, en)).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`, { headers: { "Content-Type": "application/xml" } });
}
