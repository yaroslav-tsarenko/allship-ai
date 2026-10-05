"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { visibilityIcon, visibilityOffIcon } from "./icons.generated";
import { TextField, type TextFieldProps } from "./text-field";

const iconMotion = "absolute transition-[opacity,scale,rotate] duration-(--duration-medium2) ease-(--ease-emphasized)";

export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, "type" | "trailing">>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    const label = visible ? "Hide password" : "Show password";
    return (
      <TextField
        ref={ref}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="state-layer relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] text-on-surface-variant transition-[border-radius] duration-(--duration-short4) ease-standard active:rounded-[12px]"
          >
            <Icon icon={visibilityIcon} size={24} className={cn(iconMotion, visible ? "scale-50 -rotate-45 opacity-0" : "scale-100 rotate-0 opacity-100")} />
            <Icon icon={visibilityOffIcon} size={24} className={cn(iconMotion, visible ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-45 opacity-0")} />
          </button>
        }
        {...props}
      />
    );
  },
);
