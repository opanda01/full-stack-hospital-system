import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FlaskConical, ArrowRight } from "lucide-react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";

type Tetkik = {
  id: string;
  tetkik_turu: string;
  durum: string;
  created_at?: string;
};

export function LaborantBekleyenPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["tetkikler-bekleyen"],
    queryFn: async () => {
      const all = unwrapPage(
        (
          await api.get<PageResponse<Tetkik>>("/tetkikler/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      );
      return all.filter((t) => t.durum !== "SONUCLANDI");
    },
  });

  return (
    <AppShell
      title="Bekleyen Tetkikler"
      links={[
        { to: "/laborant", label: "Ana" },
        { to: "/laborant/tetkik-sonuc-girisi", label: "Sonuç girişi" },
      ]}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Sonuçlanmamış laboratuvar istekleri. Sonuç girişi için ilgili tetkike
        geçin.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">Bekleyen tetkik yok.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm"
            >
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.tetkik_turu}</p>
                  <p className="text-muted-foreground">
                    #{t.id.slice(0, 8)} · {t.durum}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/laborant/tetkik-sonuc-girisi">
                  Sonuç gir
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
