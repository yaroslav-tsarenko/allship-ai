import "server-only";
import { marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";

export type TocItem = { id: string; text: string; level: 2 | 3 };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

export function renderMarkdown(source: string) {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const renderer = new marked.Renderer();

  renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
    const html = this.parser.parseInline(tokens);
    const text = html.replace(/<[^>]+>/g, "");
    let id = slug(text);
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    if (depth === 2 || depth === 3) toc.push({ id, text, level: depth });
    return `<h${depth} id="${id}">${html}</h${depth}>`;
  };

  renderer.link = function ({ href, title, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href) && !href.startsWith("https://allship.ai");
    const t = title ? ` title="${title}"` : "";
    return external ? `<a href="${href}"${t} rel="noopener noreferrer" target="_blank">${text}</a>` : `<a href="${href}"${t}>${text}</a>`;
  };

  const raw = marked.parse(source, { renderer, gfm: true, async: false }) as string;
  const html = sanitizeHtml(raw, {
    allowedTags: ["h2", "h3", "h4", "p", "a", "ul", "ol", "li", "strong", "em", "blockquote", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "hr", "br", "img", "figure", "figcaption"],
    allowedAttributes: { a: ["href", "title", "rel", "target"], h2: ["id"], h3: ["id"], h4: ["id"], img: ["src", "alt", "width", "height", "loading"], th: ["align"], td: ["align"] },
    allowedSchemes: ["https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: { img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }) },
  });

  const words = source.split(/\s+/).filter(Boolean).length;
  return { html, toc, readingMinutes: Math.max(1, Math.round(words / 230)) };
}
