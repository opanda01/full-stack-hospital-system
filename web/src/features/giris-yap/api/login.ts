import { api } from "@/shared/api";

export type LoginResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  rol: string;
};

export async function loginRequest(email: string, sifre: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, sifre });
  return data;
}
