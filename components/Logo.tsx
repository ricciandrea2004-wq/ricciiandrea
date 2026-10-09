// Logo competia.work: simbolo "c." e wordmark sempre in minuscolo.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#37352f" />
      <path d="M38.72 41A14 14 0 1 1 38.72 23" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="47" cy="43" r="4.5" fill="#5aa5e6" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      competia<span className="wordmark-dot">.</span>work
    </span>
  );
}
