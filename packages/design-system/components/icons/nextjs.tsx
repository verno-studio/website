import type { SVGProps } from "react";

export const NextJsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 180 180"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <mask height="180" id="nextjs-icon-glyph" maskUnits="userSpaceOnUse" width="180" x="0" y="0">
      <circle cx="90" cy="90" fill="#fff" r="90" />
      <path
        d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
        fill="url(#nextjs-icon-fade-n)"
      />
      <rect fill="url(#nextjs-icon-fade-stem)" height="72" width="12" x="115" y="54" />
    </mask>
    <circle cx="90" cy="90" fill="currentColor" mask="url(#nextjs-icon-glyph)" r="90" />
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="nextjs-icon-fade-n"
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
        id="nextjs-icon-fade-stem"
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
