/** Kurum amblemi placeholder — gerçek logo ile değiştirilebilir. */
export function InstitutionEmblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <path
        d="M24 10v28M14 24h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
    </svg>
  );
}
