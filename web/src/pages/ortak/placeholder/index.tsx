type PlaceholderPageProps = {
  title?: string;
  description?: string;
};

/** Nav maddeleri için boş sayfa iskeleti. */
export function PlaceholderPage({
  title = "Yakında",
  description = "Bu sayfa bir sonraki fazda tamamlanacaktır.",
}: PlaceholderPageProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
