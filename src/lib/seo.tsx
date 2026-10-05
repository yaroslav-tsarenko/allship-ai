import type { Metadata } from "next";
import { site } from "@/content/site";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  absoluteTitle?: boolean;
  canonicalPath?: string;
};

export function buildMetadata({ title, description, path, image, noindex, type = "website", publishedTime, modifiedTime, absoluteTitle, canonicalPath }: BuildMetadataInput): Metadata {
  const url = new URL(canonicalPath ?? path, site.url).toString();
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type,
      url,
      siteName: site.name,
      title,
      description,
      locale: "en_US",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

type Crumb = { name: string; path: string };

export const jsonLd = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: `${site.url}/brand/logo.png`,
    email: site.email,
    telephone: site.phone.e164,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: site.socials.map((s) => s.href),
  }),
  website: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    publisher: { "@id": `${site.url}/#organization` },
  }),
  breadcrumbs: (items: Crumb[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.path, site.url).toString(),
    })),
  }),
  service: ({ name, description, path, serviceType }: { name: string; description: string; path: string; serviceType: string }) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    url: new URL(path, site.url).toString(),
    areaServed: { "@type": "Country", name: "United States" },
    provider: { "@id": `${site.url}/#organization` },
  }),
  faq: (items: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
  }),
  article: ({ title, description, path, image, publishedAt, updatedAt, authorName }: { title: string; description: string; path: string; image?: string; publishedAt: string; updatedAt: string; authorName: string }) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    mainEntityOfPage: new URL(path, site.url).toString(),
    image: image ? [new URL(image, site.url).toString()] : undefined,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: { "@type": "Person", name: authorName },
    publisher: { "@id": `${site.url}/#organization` },
  }),
  webApplication: ({ name, description, path }: { name: string; description: string; path: string }) => ({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: new URL(path, site.url).toString(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }),
};

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
