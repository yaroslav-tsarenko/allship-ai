"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { assignDriverAction } from "@/server/actions/trips";

type Person = { userId: string; name: string; role: string };

const roleSuffix: Record<string, string> = { owner: " (owner)", dispatcher: " (dispatcher)", driver: "" };

export function AssignDriver({ loadId, people, currentDriverId, selfId }: { loadId: string; people: Person[]; currentDriverId: string | null; selfId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(currentDriverId ?? "");
  const [error, setError] = useState<string | undefined>();
  const { executeAsync, isPending } = useAction(assignDriverAction);
  const sorted = [...people].sort((a, b) => Number(a.role !== "driver") - Number(b.role !== "driver") || a.name.localeCompare(b.name));
  const options = sorted.map((p) => ({ value: p.userId, label: `${p.name}${p.userId === selfId ? " (you)" : (roleSuffix[p.role] ?? "")}` }));
  const changed = value !== "" && value !== currentDriverId;

  return (
    <form
      className="flex flex-col gap-3 medium:flex-row medium:items-start"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value) return setError("Pick who's driving this load");
        setError(undefined);
        const result = await executeAsync({ loadId, driverId: value });
        if (result?.serverError) return setError(result.serverError);
        const name = people.find((p) => p.userId === value)?.name ?? "Driver";
        toast(currentDriverId ? `Reassigned to ${name}` : `${name} is assigned. We've let them know.`);
        router.refresh();
      }}
    >
      <SelectField
        label={currentDriverId ? "Driver" : "Choose a driver"}
        placeholder="Select a person"
        options={options}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        className="min-w-0 flex-1"
      />
      <Button type="submit" size="lg" variant={currentDriverId ? "tonal" : "filled"} loading={isPending} disabled={!changed}>
        {currentDriverId ? "Reassign" : "Assign"}
      </Button>
    </form>
  );
}
