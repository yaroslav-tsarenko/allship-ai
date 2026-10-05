import type { SVGProps } from "react";

export function SparkIcon({
  size = 24,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M12 2.5c.32 0 .6.22.68.53.53 2.08 1.39 3.8 2.6 5.03 1.2 1.22 2.93 2.08 5.03 2.62a.7.7 0 0 1 0 1.36c-2.1.54-3.82 1.4-5.03 2.62-1.21 1.22-2.07 2.95-2.6 5.03a.7.7 0 0 1-1.36 0c-.53-2.08-1.39-3.8-2.6-5.03-1.2-1.22-2.93-2.08-5.03-2.62a.7.7 0 0 1 0-1.36c2.1-.54 3.82-1.4 5.03-2.62 1.21-1.22 2.07-2.95 2.6-5.03A.7.7 0 0 1 12 2.5Z" />
    </svg>
  );
}
