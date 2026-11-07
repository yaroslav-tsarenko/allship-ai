"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type ComponentType, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";
import { TextField, type TextFieldProps } from "./text-field";

export type ComboboxInputProps = InputHTMLAttributes<HTMLInputElement> & { ref: Ref<HTMLInputElement>; label: string; invalid?: boolean };

export type ComboboxProps<T> = Omit<TextFieldProps, "value" | "onChange" | "onSelect" | "defaultValue"> & {
  value: string;
  onInputChange: (value: string) => void;
  items: readonly T[];
  itemKey: (item: T) => string;
  renderItem: (item: T, active: boolean) => ReactNode;
  onSelectItem: (item: T) => void;
  loading?: boolean;
  emptyText?: ReactNode;
  minChars?: number;
  listLabel: string;
  footer?: ReactNode;
  openOnFocus?: boolean;
  inputComponent?: ComponentType<ComboboxInputProps>;
  popupClassName?: string;
};

const fieldOnly = new Set(["label", "supportingText", "error", "leading", "trailing"]);

function nativeProps(field: object): InputHTMLAttributes<HTMLInputElement> {
  return Object.fromEntries(Object.entries(field).filter(([k]) => !fieldOnly.has(k)));
}

function ComboboxInner<T>(
  { value, onInputChange, items, itemKey, renderItem, onSelectItem, loading = false, emptyText, minChars = 1, listLabel, footer, openOnFocus = false, inputComponent: InputComponent, popupClassName, onBlur, onFocus, onKeyDown, trailing, className, ...field }: ComboboxProps<T>,
  ref: Ref<HTMLInputElement>,
) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const closeTimer = useRef<number | undefined>(undefined);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const enough = value.trim().length >= minChars;
  const showEmpty = open && enough && !loading && items.length === 0 && Boolean(emptyText);
  const expanded = open && (items.length > 0 || showEmpty || (loading && enough));
  const activeIndex = active >= items.length ? -1 : active;

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const choose = (item: T) => {
    onSelectItem(item);
    setOpen(false);
    setActive(-1);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (!items.length) return;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i < 0 ? (dir === 1 ? 0 : items.length - 1) : (i + dir + items.length) % items.length));
    } else if (e.key === "Enter" && expanded && activeIndex >= 0) {
      e.preventDefault();
      choose(items[activeIndex]!);
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Tab" && expanded && activeIndex >= 0) {
      choose(items[activeIndex]!);
    }
  };

  const inputProps: Omit<ComboboxInputProps, "label"> = {
    ref: inputRef,
    value,
    role: "combobox",
    "aria-expanded": expanded,
    "aria-controls": listId,
    "aria-autocomplete": "list",
    "aria-activedescendant": expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined,
    autoComplete: "off",
    onChange: (e) => {
      onInputChange(e.target.value);
      setOpen(true);
      setActive(-1);
    },
    onFocus: (e) => {
      window.clearTimeout(closeTimer.current);
      if (openOnFocus) setOpen(true);
      onFocus?.(e);
    },
    onBlur: (e) => {
      closeTimer.current = window.setTimeout(() => {
        setOpen(false);
        setActive(-1);
      }, 120);
      onBlur?.(e);
    },
    onKeyDown: handleKey,
  };

  const status = !open || !enough ? "" : loading ? "Searching" : items.length ? `${items.length} ${items.length === 1 ? "suggestion" : "suggestions"}. Use the arrow keys to choose.` : showEmpty ? String(typeof emptyText === "string" ? emptyText : "No matches") : "";

  return (
    <div className={cn("relative", className)}>
      {InputComponent ? (
        <InputComponent {...nativeProps(field)} {...inputProps} label={field.label} invalid={Boolean(field.error)} />
      ) : (
        <TextField
          {...field}
          {...inputProps}
          trailing={
            loading && enough ? (
              <span className="flex size-10 items-center justify-center">
                <Spinner size={20} />
              </span>
            ) : (
              trailing
            )
          }
        />
      )}
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={listLabel}
        hidden={!expanded}
        className={cn("absolute inset-x-0 top-[60px] z-40 max-h-80 overflow-y-auto overscroll-contain rounded-xs bg-surface-container py-2 shadow-elevation-2", popupClassName)}
      >
        {items.map((item, i) => (
          <li
            key={itemKey(item)}
            id={`${listId}-${i}`}
            data-index={i}
            role="option"
            aria-selected={i === activeIndex}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(item)}
            onMouseMove={() => i !== activeIndex && setActive(i)}
            className={cn("cursor-pointer px-4 py-2.5 text-body-lg text-on-surface", i === activeIndex && "bg-on-surface/8")}
          >
            {renderItem(item, i === activeIndex)}
          </li>
        ))}
        {loading && enough && items.length === 0 && (
          <li role="presentation" className="flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface-variant">
            <Spinner size={18} />
            Searching
          </li>
        )}
        {showEmpty && (
          <li role="presentation" className="px-4 py-2.5 text-body-md text-on-surface-variant">
            {emptyText}
          </li>
        )}
        {footer && expanded && (
          <li role="presentation" className="px-4 pt-2 text-right text-label-sm text-on-surface-variant">
            {footer}
          </li>
        )}
      </ul>
      <span className="sr-only" aria-live="polite">
        {status}
      </span>
    </div>
  );
}

export const Combobox = forwardRef(ComboboxInner) as <T>(props: ComboboxProps<T> & { ref?: Ref<HTMLInputElement> }) => ReturnType<typeof ComboboxInner>;
