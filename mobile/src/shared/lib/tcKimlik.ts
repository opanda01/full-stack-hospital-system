/** seed_rbac: hasta@hastane.example.com */
export const DEMO_HASTA_TC = "34917047162";
export const DEMO_HASTA_TELEFON = "05551234567";
export const DEMO_HASTA_ETIKET = "Test Hasta";

export const TC_GECERSIZ_MESAJ = "Geçersiz TC kimlik numarası";

export function gecerliTcKimlikNo(tc: string): boolean {
  const v = tc.trim();
  if (!v || v.length !== 11 || !/^\d+$/.test(v)) {
    return false;
  }
  if (v[0] === "0") {
    return false;
  }
  const digits = v.split("").map((c) => Number(c));
  const oddSum =
    digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (digits[9] !== d10) {
    return false;
  }
  const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return digits[10] === d11;
}
