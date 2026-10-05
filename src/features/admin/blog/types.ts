import type { PostStatus } from "./rules";

export type FaqItem = { question: string; answer: string };

export type EditorFields = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverKey: string | null;
  coverAlt: string | null;
  categoryId: string | null;
  tagIds: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  faq: FaqItem[];
};

export type EditorInitial = {
  id: string | null;
  updatedAt: string | null;
  status: PostStatus;
  publishedAt: string | null;
  authorName: string;
  liveSlug: string | null;
  fields: EditorFields;
};

export type EditorOptions = {
  categories: Array<{ id: string; slug: string; name: string }>;
  tags: Array<{ id: string; slug: string; name: string }>;
  posts: Array<{ id: string; slug: string; title: string }>;
  siteHost: string;
  aiConfigured: boolean;
};

export const emptyFields: EditorFields = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverKey: null,
  coverAlt: null,
  categoryId: null,
  tagIds: [],
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  faq: [],
};
