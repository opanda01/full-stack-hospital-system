import { isAxiosError } from "axios";

/** Axios / FastAPI hata gövdesinden okunabilir mesaj çıkarır. */
export function getApiErrorMessage(
  err: unknown,
  fallback = "İşlem başarısız",
): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      return "API'ye ulaşılamadı. Backend'in çalıştığından emin olun.";
    }
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : String(item),
        )
        .join("; ");
    }
    if (detail != null) return String(detail);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
