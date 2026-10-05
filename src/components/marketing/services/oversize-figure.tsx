export function OversizeFigure() {
  return (
    <figure className="m-0 rounded-lg bg-surface-container-low p-4 medium:p-8">
      <svg viewBox="0 0 640 300" role="img" aria-labelledby="oversize-title oversize-desc" className="h-auto w-full">
        <title id="oversize-title">Legal size limits for a load on a lowboy trailer</title>
        <desc id="oversize-desc">
          Side view of an excavator on a lowboy trailer showing overall height measured from the road, and a rear view showing the standard legal width of 8 feet 6 inches.
        </desc>
        <g className="fill-none stroke-outline" strokeWidth="2">
          <line x1="20" y1="250" x2="620" y2="250" />
        </g>
        <g className="fill-on-surface-variant">
          <rect x="40" y="200" width="70" height="36" rx="4" />
          <rect x="110" y="214" width="290" height="14" rx="2" />
          <circle cx="62" cy="240" r="10" />
          <circle cx="92" cy="240" r="10" />
          <circle cx="352" cy="238" r="12" />
          <circle cx="382" cy="238" r="12" />
          <path d="M70 200 L70 176 L104 176 L110 200 Z" />
        </g>
        <g className="fill-primary">
          <rect x="160" y="196" width="150" height="18" rx="4" />
          <rect x="190" y="146" width="80" height="50" rx="4" />
          <path d="M270 160 L330 104 L342 114 L284 172 Z" />
          <path d="M330 104 L356 150 L344 156 L322 116 Z" />
          <path d="M350 146 L368 166 L346 170 Z" />
        </g>
        <g className="stroke-on-surface" strokeWidth="1.5">
          <line x1="424" y1="100" x2="424" y2="250" />
          <line x1="416" y1="100" x2="432" y2="100" />
          <line x1="416" y1="250" x2="432" y2="250" />
        </g>
        <text x="434" y="168" className="fill-on-surface font-sans text-body-md">
          Height
        </text>
        <text x="434" y="188" className="fill-on-surface-variant font-sans text-body-sm">
          from the road
        </text>
        <g className="fill-on-surface-variant">
          <rect x="520" y="200" width="80" height="30" rx="3" />
          <rect x="514" y="230" width="14" height="20" rx="2" />
          <rect x="592" y="230" width="14" height="20" rx="2" />
        </g>
        <g className="fill-primary">
          <rect x="530" y="148" width="60" height="52" rx="4" />
        </g>
        <g className="stroke-on-surface" strokeWidth="1.5">
          <line x1="514" y1="276" x2="606" y2="276" />
          <line x1="514" y1="268" x2="514" y2="284" />
          <line x1="606" y1="268" x2="606" y2="284" />
        </g>
        <text x="560" y="298" textAnchor="middle" className="fill-on-surface font-sans text-body-md">
          8 ft 6 in
        </text>
        <text x="560" y="134" textAnchor="middle" className="fill-on-surface-variant font-sans text-body-sm">
          Rear view
        </text>
      </svg>
      <figcaption className="mt-4 text-body-md text-pretty text-on-surface-variant">
        Width is measured at the widest point, including tracks, mirrors and attachments. Height is measured from the road to the top of the load, so a lower deck leaves more room for the machine.
      </figcaption>
    </figure>
  );
}
