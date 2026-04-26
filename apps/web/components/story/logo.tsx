import type { ComponentProps } from "react";

const Turborepo = (props: ComponentProps<"svg">) => (
  <svg {...props} fill="none" viewBox="0 0 100 100">
    <path
      fill="#fff"
      d="M49.542 17.322c-17.766 0-32.22 14.454-32.22 32.22s14.454 32.22 32.22 32.22 32.22-14.454 32.22-32.22-14.454-32.22-32.22-32.22Zm0 48.894c-9.21 0-16.674-7.464-16.674-16.674 0-9.21 7.464-16.674 16.674-16.674 9.21 0 16.674 7.464 16.674 16.674 0 9.21-7.464 16.674-16.674 16.674Z"
    />
    <path
      fill="url(#turborepo_icon_dark__a)"
      fillRule="evenodd"
      d="M52.242 12.03V0c26.148 1.398 46.92 23.046 46.92 49.542 0 26.496-20.772 48.138-46.92 49.542v-12.03c19.488-1.392 34.92-17.676 34.92-37.512 0-19.836-15.432-36.12-34.92-37.512ZM21.126 74.142c-5.166-5.964-8.496-13.56-9.09-21.9H0c.624 11.67 5.292 22.26 12.606 30.414l8.514-8.514h.006Zm25.716 24.942v-12.03c-8.346-.594-15.942-3.918-21.906-9.09l-8.514 8.514c8.16 7.32 18.75 11.982 30.414 12.606h.006Z"
      clipRule="evenodd"
    />
    <defs>
      <linearGradient
        id="turborepo_icon_dark__a"
        x1="54.186"
        x2="5.418"
        y1="6.967"
        y2="55.735"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0096FF" />
        <stop offset="1" stopColor="#FF1E56" />
      </linearGradient>
    </defs>
  </svg>
);

const Nextjs = (props: ComponentProps<"svg">) => (
  <svg {...props} viewBox="0 0 180 180">
    <mask
      height="180"
      id="nextjs_icon_dark__:r8:mask0_408_134"
      maskUnits="userSpaceOnUse"
      width="180"
      x="0"
      y="0"
      style={{ maskType: "alpha" }}
    >
      <circle cx="90" cy="90" fill="black" r="90" />
    </mask>
    <g mask="url(#nextjs_icon_dark__:r8:mask0_408_134)">
      <circle cx="90" cy="90" data-circle="true" fill="black" r="90" />
      <path
        d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
        fill="url(#nextjs_icon_dark__:r8:paint0_linear_408_134)"
      />
      <rect
        fill="url(#nextjs_icon_dark__:r8:paint1_linear_408_134)"
        height="72"
        width="12"
        x="115"
        y="54"
      />
    </g>
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="nextjs_icon_dark__:r8:paint0_linear_408_134"
        x1="109"
        x2="144.5"
        y1="116.5"
        y2="160.5"
      >
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="nextjs_icon_dark__:r8:paint1_linear_408_134"
        x1="121"
        x2="120.799"
        y1="54"
        y2="106.875"
      >
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

export { Turborepo, Nextjs };
