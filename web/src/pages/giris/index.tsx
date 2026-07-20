import { GirisYapForm } from "@/features/giris-yap";

export function GirisPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-primary">
          Çanakkale Mehmet Akif Ersoy Devlet Hastanesi
        </h1>
        <p className="mt-2 text-muted-foreground">Hastane Bilgi Yönetim Sistemi — Web</p>
        <p className="mt-1 text-sm text-muted-foreground">Hello World — iskelet çalışıyor</p>
      </div>
      <GirisYapForm />
    </main>
  );
}
