"use client";

import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import { uploadBlogImage } from "@/features/admin/blog/upload";
import { deletePartnerLogoAction, savePartnerLogoAction } from "@/server/actions/showcase";
import { partnerLogoInput, type PartnerLogoInput } from "./schema";

export type LogoRow = Omit<PartnerLogoInput, "confirmPermission">;

export const emptyLogo: LogoRow = { id: null, name: "", imageUrl: "", href: null, relationship: "", published: false, sort: 0 };

export function LogoDialog({ initial, open, onOpenChange }: { initial: LogoRow; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [form, setForm] = useState<PartnerLogoInput>({ ...initial, confirmPermission: initial.published });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useAction(savePartnerLogoAction);
  const remove = useAction(deletePartnerLogoAction);
  const set = <K extends keyof PartnerLogoInput>(key: K, value: PartnerLogoInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      set("imageUrl", await uploadBlogImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    const parsed = partnerLogoInput.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const result = await save.executeAsync(parsed.data);
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't save the logo.");
    toast.success(form.published ? "Logo published" : "Logo saved as a draft");
    onOpenChange(false);
    router.refresh();
  };

  const destroy = async () => {
    if (!form.id || !window.confirm("Delete this logo? This can't be undone.")) return;
    const result = await remove.executeAsync({ id: form.id });
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't delete the logo.");
    toast.success("Logo deleted");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={form.id ? "Edit logo" : "Add a logo"}
      description="Show a company's logo only when it is a real customer or partner and you have its permission. Logos must not imply an endorsement that doesn't exist."
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
          <Button onClick={submit} loading={save.isExecuting} disabled={uploading}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-40 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-surface p-3">
            {form.imageUrl ? <Image src={form.imageUrl} alt="" width={136} height={56} unoptimized className="max-h-full w-auto max-w-full object-contain" /> : <span className="text-body-sm text-on-surface-variant">No image</span>}
          </div>
          <div className="flex flex-col gap-1">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="logo-file" onChange={(e) => void upload(e.target.files?.[0])} />
            <Button variant="tonal" onClick={() => fileRef.current?.click()} loading={uploading}>
              {form.imageUrl ? "Replace image" : "Upload image"}
            </Button>
            <span className="text-body-sm text-on-surface-variant">PNG with a transparent background works best.</span>
            {errors.imageUrl && <span className="text-body-sm text-error">{errors.imageUrl}</span>}
          </div>
        </div>
        <TextField label="Company name" required value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label="Relationship" required value={form.relationship} onChange={(e) => set("relationship", e.target.value)} error={errors.relationship} supportingText="Shown under the logo, e.g. “Customer since 2025” or “Payments partner”" />
        <TextField label="Website (optional)" type="url" inputMode="url" value={form.href ?? ""} onChange={(e) => set("href", e.target.value.trim() ? e.target.value : null)} error={errors.href} />
        <TextField label="Sort order" type="number" value={String(form.sort)} onChange={(e) => set("sort", Number(e.target.value) || 0)} className="max-w-[200px]" />
        <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} label="Published" />
        <Checkbox checked={form.confirmPermission} onCheckedChange={(v) => set("confirmPermission", v === true)} label="I confirm this company works with us and agreed to have its logo shown." error={errors.confirmPermission} />
      </div>
    </Dialog>
  );
}
