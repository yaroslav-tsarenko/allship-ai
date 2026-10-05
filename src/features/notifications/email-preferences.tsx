"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setEmailPreferenceAction } from "@/server/actions/notifications";

type Group = { key: string; label: string; description: string };

export function EmailPreferences({ groups, initial }: { groups: Group[]; initial: Record<string, boolean> }) {
  const [values, setValues] = useState(initial);

  const change = async (key: string, enabled: boolean) => {
    setValues((v) => ({ ...v, [key]: enabled }));
    const result = await setEmailPreferenceAction({ group: key, enabled });
    if (result?.data) {
      toast(enabled ? "Emails turned on" : "Emails turned off");
      return;
    }
    setValues((v) => ({ ...v, [key]: !enabled }));
    toast.error(result?.serverError ?? "Couldn't save. Try again.");
  };

  return (
    <ul className="flex flex-col">
      {groups.map((g, i) => (
        <li key={g.key} className={i > 0 ? "border-t border-outline-variant/60" : undefined}>
          <Switch className="px-6 py-4" checked={values[g.key] ?? true} onCheckedChange={(v) => void change(g.key, v)} label={g.label} description={g.description} />
        </li>
      ))}
    </ul>
  );
}
