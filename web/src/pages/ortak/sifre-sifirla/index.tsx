import { AuthLayout } from "@/shared/ui";
import { SifreSifirlaForm } from "@/features/sifre-sifirla";

export function SifreSifirlaPage() {
  return (
    <AuthLayout
      title="Şifremi unuttum"
      subtitle="Sicil numaranız, kullanıcı adınız veya e-postanız ile doğrulama kodu alın; ardından yeni şifrenizi belirleyin."
    >
      <SifreSifirlaForm />
    </AuthLayout>
  );
}
