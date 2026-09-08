/**
 * A decorative spiral, used as the blank-state glyph on round elements that
 * have nothing else to show (an Avatar with no identity, a round Button with
 * no icon yet). Not exported from the package's public entry point — it's an
 * internal shared asset for those two components' empty states, not a public
 * component in its own right.
 */
export function SwirlGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={['keel-Swirl', className].filter(Boolean).join(' ')}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 16c0-3.5-2.5-6-6-6s-6 2.5-6 6 2.5 6 6 6c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9 9-4 9-9-4-9-9-9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
