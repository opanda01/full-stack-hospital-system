import { AppShell } from "@/shared/ui";
import { useAuthStore } from "@/shared/auth";

/** Rol bazlı boş dashboard — login akışını doğrulamak için. */
export function RoleWelcome({
  title,
  links = [],
}: {
  title: string;
  links?: { to: string; label: string }[];
}) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const roles = useAuthStore((s) => s.roles);
  const ad = currentUser ? `${currentUser.ad} ${currentUser.soyad}` : "Kullanıcı";
  const rol = currentUser?.rol ?? roles[0] ?? "—";

  return (
    <AppShell title={title} links={links}>
      <p className="text-lg text-slate-800">
        Hoş geldiniz, {ad} ({rol})
      </p>
    </AppShell>
  );
}
