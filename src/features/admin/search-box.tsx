import { Icon } from "@/components/ui/icon";
import { searchIcon } from "@/components/ui/icons.generated";

export function SearchBox({ action, label, placeholder, value, keep }: { action: string; label: string; placeholder: string; value?: string; keep?: Record<string, string | undefined> }) {
  return (
    <form action={action} role="search" className="w-full shrink-0 large:w-72">
      {keep && Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="flex h-12 items-center gap-3 rounded-full bg-surface-container-high px-4 text-on-surface-variant focus-within:outline-2 focus-within:outline-primary">
        <Icon icon={searchIcon} size={20} />
        <span className="sr-only">{label}</span>
        <input
          type="search"
          name="q"
          defaultValue={value}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </label>
    </form>
  );
}
