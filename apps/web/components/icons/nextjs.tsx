import type { SVGProps } from "react";

interface NextJsIconProps extends SVGProps<SVGSVGElement> {
  // The mask and the two gradients are referenced by `url(#id)`, which resolves
  // document-wide. Rendering this icon twice on a page would have both copies
  // point at the first one's defs; a caller-supplied prefix keeps them apart.
  readonly idPrefix?: string;
}

export const NextJsIcon = ({ idPrefix = "nextjs-icon", ...props }: NextJsIconProps) => {
  const glyphId = `${idPrefix}-glyph`;
  const fadeNId = `${idPrefix}-fade-n`;
  const fadeStemId = `${idPrefix}-fade-stem`;

  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 180 180"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask height="180" id={glyphId} maskUnits="userSpaceOnUse" width="180" x="0" y="0">
        <circle cx="90" cy="90" fill="#fff" r="90" />
        <path
          d="M149.51 157.52L69.14 54H54V125.97H66.11V69.38L140 164.85C143.33 162.61 146.51 160.17 149.51 157.52Z"
          fill={`url(#${fadeNId})`}
        />
        <rect fill={`url(#${fadeStemId})`} height="72" width="12" x="115" y="54" />
      </mask>
      <circle cx="90" cy="90" fill="currentColor" mask={`url(#${glyphId})`} r="90" />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={fadeNId}
          x1="109"
          x2="144.5"
          y1="116.5"
          y2="160.5"
        >
          <stop stopColor="#000" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={fadeStemId}
          x1="121"
          x2="120.799"
          y1="54"
          y2="106.875"
        >
          <stop stopColor="#000" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};
