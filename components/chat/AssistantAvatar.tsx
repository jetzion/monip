import { useId } from "react";

/** Illustrated face for David, the AI chat assistant; decorative (the name is always shown as text). */
export function AssistantAvatar({ className }: { className?: string }) {
  const id = useId();
  const bg = `${id}-bg`;
  const clip = `${id}-clip`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b8fd6" />
          <stop offset="1" stopColor="#3d4ea0" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${bg})`} />
      <g clipPath={`url(#${clip})`}>
        <path d="M9 66c1.5-12.5 11-19.5 23-19.5S53.5 53.5 55 66z" fill="#141b3a" />
        <path d="M26.5 46.8 32 54l5.5-7.2c-1.7-.5-3.6-.8-5.5-.8s-3.8.3-5.5.8z" fill="#ffffff" />
        <path d="M28 38.5h8v8.3a4 4 0 0 1-8 0z" fill="#d9a083" />
        <circle cx="20.8" cy="30.5" r="2.6" fill="#e8b394" />
        <circle cx="43.2" cy="30.5" r="2.6" fill="#e8b394" />
        <ellipse cx="32" cy="29.5" rx="11" ry="12.5" fill="#f0c3a4" />
        <path
          d="M20.6 27.5C19.8 18 25.6 13.8 32.4 13.8c7 0 12.2 4.4 11.1 13.4-2-5.4-6.3-7.2-11.4-6.8-5 .4-8.8 2.4-11.5 7.1z"
          fill="#3a2a22"
        />
        <circle cx="27.6" cy="30" r="1.35" fill="#141b3a" />
        <circle cx="36.4" cy="30" r="1.35" fill="#141b3a" />
        <path d="M28.3 35.2q3.7 3 7.4 0" fill="none" stroke="#9a5644" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
