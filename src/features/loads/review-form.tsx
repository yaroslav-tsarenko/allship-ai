"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { starIcon } from "@/components/ui/icons.generated";
import { TextArea } from "@/components/ui/text-area";
import { cn } from "@/lib/cn";
import { checkText } from "@/lib/validation/text-policy";
import { createReviewAction } from "@/server/actions/trips";

const ratingWords = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function Stars({ rating, size = 20, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex text-warning", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} icon={starIcon} filled={n <= rating} size={size} className={n <= rating ? undefined : "text-outline-variant"} />
      ))}
    </span>
  );
}

export function ReviewForm({ loadId, carrierName }: { loadId: string; carrierName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [bodyError, setBodyError] = useState<string | undefined>();
  const { executeAsync, isPending } = useAction(createReviewAction);
  const shown = hover || rating;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Choose a rating from 1 to 5 stars");
    const issue = checkText(body, { contacts: false });
    if (issue) return setBodyError(issue.message);
    const res = await executeAsync({ loadId, rating, body: body.trim() || undefined });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.validationErrors) return setBodyError(res.validationErrors.body?._errors?.[0] ?? "Check your review and try again.");
    toast.success("Thanks, your review is posted.");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <fieldset>
        <legend className="text-body-md text-on-surface-variant">How did {carrierName} do?</legend>
        <div className="mt-2 flex items-center gap-3" onMouseLeave={() => setHover(0)}>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="relative cursor-pointer" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => {
                    setRating(n);
                    setError(undefined);
                  }}
                  className="peer sr-only"
                  aria-describedby={error ? "rating-error" : undefined}
                />
                <span className="flex size-12 items-center justify-center rounded-full transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-primary hover:bg-on-surface/8">
                  <Icon icon={starIcon} filled={n <= shown} size={32} className={n <= shown ? "text-warning" : "text-outline"} />
                </span>
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}, {ratingWords[n]}
                </span>
              </label>
            ))}
          </div>
          <span aria-hidden="true" className="text-title-sm text-on-surface-variant">
            {ratingWords[shown]}
          </span>
        </div>
        {error && (
          <p id="rating-error" role="alert" className="mt-1 text-body-sm text-error">
            {error}
          </p>
        )}
      </fieldset>
      <TextArea
        label="Tell other shippers about it (optional)"
        rows={3}
        maxLength={2000}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setBodyError(undefined);
        }}
        onBlur={() => setBodyError(checkText(body, { contacts: false })?.message)}
        error={bodyError}
        supportingText="Was pickup on time? How was communication and handling?"
      />
      <Button type="submit" loading={isPending} className="self-start">
        Post review
      </Button>
    </form>
  );
}
