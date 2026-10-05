const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export const formatPostDate = (d: Date | string | null) => (d ? dateFmt.format(new Date(d)) : "");

export function PostMeta({ publishedAt, readingMinutes, authorName }: { publishedAt: Date | string | null; readingMinutes: number; authorName?: string }) {
  return (
    <p className="text-body-md text-on-surface-variant">
      {authorName && <span>{authorName} · </span>}
      <time dateTime={publishedAt ? new Date(publishedAt).toISOString() : undefined}>{formatPostDate(publishedAt)}</time> · {readingMinutes} min read
    </p>
  );
}
