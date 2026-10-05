"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { deleteTestimonialAction, saveTestimonialAction } from "@/server/actions/showcase";
import { SHOWCASE_PLACEMENTS, testimonialInput, type PlacementKey, type TestimonialInput } from "./schema";

export type TestimonialRow = Omit<TestimonialInput, "confirmGenuine">;

export const emptyTestimonial: TestimonialRow = {
  id: null,
  quote: "",
  authorName: "",
  authorDetail: null,
  rating: 5,
  sourceLabel: "",
  sourceUrl: null,
  reviewedAt: null,
  audience: "any",
  placements: [],
  published: false,
  sort: 0,
};

export function TestimonialDialog({ initial, open, onOpenChange }: { initial: TestimonialRow; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [form, setForm] = useState<TestimonialInput>({ ...initial, confirmGenuine: initial.published });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction(saveTestimonialAction);
  const remove = useAction(deleteTestimonialAction);
  const set = <K extends keyof TestimonialInput>(key: K, value: TestimonialInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (v: string) => (v.trim() ? v : null);

  const submit = async () => {
    const parsed = testimonialInput.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const result = await save.executeAsync(parsed.data);
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't save the review.");
    toast.success(form.published ? "Review published" : "Review saved as a draft");
    onOpenChange(false);
    router.refresh();
  };

  const destroy = async () => {
    if (!form.id || !window.confirm("Delete this review? This can't be undone.")) return;
    const result = await remove.executeAsync({ id: form.id });
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't delete the review.");
    toast.success("Review deleted");
    onOpenChange(false);
    router.refresh();
  };

  const togglePlacement = (key: PlacementKey) => set("placements", form.placements.includes(key) ? form.placements.filter((p) => p !== key) : [...form.placements, key]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={form.id ? "Edit review" : "Add a review"}
      description="Only publish genuine reviews from real customers, copied word for word, with a link to where the review was originally posted."
      className="max-w-[720px]"
      actions={
        <>
          {form.id && (
            <Button variant="text" className="mr-auto text-error" onClick={destroy} loading={remove.isExecuting}>
              Delete
            </Button>
          )}
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isExecuting}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextArea label="Quote" required rows={5} maxLength={1200} showCount value={form.quote} onChange={(e) => set("quote", e.target.value)} error={errors.quote} supportingText="Exactly as the customer wrote it. Fix nothing but obvious typos." />
        <div className="grid gap-4 medium:grid-cols-2">
          <TextField label="Reviewer name" required value={form.authorName} onChange={(e) => set("authorName", e.target.value)} error={errors.authorName} supportingText="As shown on the original review, e.g. “Maria G.”" />
          <TextField label="Detail (optional)" value={form.authorDetail ?? ""} onChange={(e) => set("authorDetail", text(e.target.value))} error={errors.authorDetail} supportingText="e.g. “Moved from Austin to Denver”" />
        </div>
        <div className="grid gap-4 medium:grid-cols-2">
          <TextField label="Source" required value={form.sourceLabel} onChange={(e) => set("sourceLabel", e.target.value)} error={errors.sourceLabel} supportingText="Where it was posted, e.g. “Google review”" />
          <TextField label="Link to the original review" type="url" inputMode="url" value={form.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", text(e.target.value))} error={errors.sourceUrl} supportingText="Required to publish" />
        </div>
        <div className="grid gap-4 medium:grid-cols-3">
          <SelectField
            label="Rating"
            value={form.rating ? String(form.rating) : ""}
            onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : null)}
            options={[{ value: "", label: "No rating" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} of 5` }))]}
          />
          <TextField label="Review date" type="date" value={form.reviewedAt ?? ""} onChange={(e) => set("reviewedAt", e.target.value || null)} error={errors.reviewedAt} />
          <SelectField
            label="Audience"
            value={form.audience}
            onChange={(e) => set("audience", e.target.value as TestimonialInput["audience"])}
            options={[
              { value: "any", label: "Everyone" },
              { value: "shipper", label: "Shippers" },
              { value: "carrier", label: "Carriers" },
            ]}
          />
        </div>
        <div>
          <ChipSet label="Show on pages">
            {SHOWCASE_PLACEMENTS.map((p) => (
              <Chip key={p.value} variant="filter" label={p.label} selected={form.placements.includes(p.value)} onClick={() => togglePlacement(p.value)} />
            ))}
          </ChipSet>
          {errors.placements && <p className="mt-2 text-body-sm text-error">{errors.placements}</p>}
        </div>
        <TextField label="Sort order" type="number" value={String(form.sort)} onChange={(e) => set("sort", Number(e.target.value) || 0)} supportingText="Lower numbers show first" className="max-w-[200px]" />
        <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} label="Published" description="Visible on the selected pages within an hour, or right away after saving." />
        <Checkbox
          checked={form.confirmGenuine}
          onCheckedChange={(v) => set("confirmGenuine", v === true)}
          label="I confirm this is a genuine review from a real customer, and the link above shows the original."
          error={errors.confirmGenuine}
        />
      </div>
    </Dialog>
  );
}
