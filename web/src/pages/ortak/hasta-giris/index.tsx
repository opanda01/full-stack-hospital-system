import { Navigate } from "react-router-dom";
import { HastaGirisForm } from "@/features/hasta-giris";
import { useAuthStore } from "@/shared/auth";
import { AuthLayout } from "@/shared/ui";

export function HastaGirisPage() {
  const rol = useAuthStore((s) => s.primaryRole());
  const token = useAuthStore((s) => s.accessToken ?? s.token);

  if (token && rol === "HASTA") {
    return <Navigate to="/hasta-mobil" replace />;
  }

  return (
    <AuthLayout
      title="Hasta girişi"
      subtitle="Telefon ve TC kimlik numaranız ile OTP doğrulaması yapın."
    >
      <HastaGirisForm />
    </AuthLayout>
  );
}
