/** Devlet hastanesi kurumsal amblemi — kırmızı haç + mavi halka. */
export function InstitutionEmblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="color-mix(in srgb, var(--brand-primary, #1e3a5f) 12%, white)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="24"
        cy="24"
        r="17"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.35"
      />
      <rect x="20" y="12" width="8" height="24" rx="1" fill="#c41e3a" />
      <rect x="12" y="20" width="24" height="8" rx="1" fill="#c41e3a" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
