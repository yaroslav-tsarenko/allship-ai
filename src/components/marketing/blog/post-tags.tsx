import { cn } from "@/lib/cn";

export function PostTags({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul aria-label="Tags" className={cn("flex flex-wrap gap-x-3 gap-y-1 text-body-sm text-on-surface-variant", className)}>
      {tags.map((t) => (
        <li key={t}>#{t}</li>
      ))}
    </ul>
  );
}
