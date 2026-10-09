// Logo competia.work: simbolo "c." e wordmark sempre in minuscolo.
// I colori del simbolo vengono dai token --logo-* (app/tokens.css), come il favicon.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect className="logo-mark__tile" width="64" height="64" rx="14" />
      <path
        className="logo-mark__glyph"
        d="M38.72 41A14 14 0 1 1 38.72 23"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle className="logo-mark__dot" cx="47" cy="43" r="4.5" />
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
