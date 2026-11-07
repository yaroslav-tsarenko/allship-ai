"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-area";
import { checkText } from "@/lib/validation/text-policy";
import { replyToReviewAction } from "@/server/actions/trips";

export function ReplyForm({ reviewId, existing }: { reviewId: string; existing?: string | null }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(existing ?? "");
  const [error, setError] = useState<string | undefined>();
  const { executeAsync, isPending } = useAction(replyToReviewAction);

  if (!open) {
    return (
      <Button variant="text" size="sm" className="-ml-3 self-start" onClick={() => setOpen(true)}>
        {existing ? "Edit reply" : "Reply"}
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (reply.trim().length < 2) return setError("Write a short reply");
        const issue = checkText(reply, { contacts: false });
        if (issue) return setError(issue.message);
        setError(undefined);
        const result = await executeAsync({ reviewId, reply: reply.trim() });
        if (result?.serverError) return setError(result.serverError);
        if (result?.validationErrors) return setError(result.validationErrors.reply?._errors?.[0] ?? "Check your reply and try again.");
        setOpen(false);
        toast(existing ? "Reply updated" : "Reply posted");
      }}
    >
      <TextArea
        label="Your public reply"
        rows={3}
        maxLength={1000}
        showCount
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        error={error}
        supportingText="Shippers see this under the review. Keep it short and specific."
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="text" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {existing ? "Save reply" : "Post reply"}
        </Button>
      </div>
    </form>
  );
}
