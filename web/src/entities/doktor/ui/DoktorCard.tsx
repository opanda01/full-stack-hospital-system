import type { Doktor } from "../model/types";

export function DoktorCard({ doktor }: { doktor: Doktor }) {
  return (
    <article className="rounded-md border border-border p-3">
      <h3 className="font-medium">{doktor.uzmanlikAlani}</h3>
      <p className="text-sm text-muted-foreground">Diploma: {doktor.diplomaNo}</p>
    </article>
  );
}
