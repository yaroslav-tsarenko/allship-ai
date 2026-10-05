import type { SVGProps } from "react";
import type { IconData } from "./icons.generated";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  icon: IconData;
  filled?: boolean;
  size?: number;
  label?: string;
};

export function Icon({ icon, filled = false, size = 24, label, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
      className={className}
      {...rest}
    >
      <path d={filled ? icon[1] : icon[0]} />
    </svg>
  );
}
