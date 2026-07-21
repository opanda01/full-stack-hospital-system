import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  IdCard,
  Building2,
  Stethoscope,
  CalendarClock,
  BarChart3,
  Settings,
  ClipboardList,
  MessageSquareWarning,
  HeartPulse,
  FlaskConical,
  UserCircle,
  CalendarDays,
  Sparkles,
  Shield,
} from "lucide-react";

/** Web paneline giriş yapabilen personel rolleri (HASTA hariç). */
export type Rol =
  | "ADMIN"
  | "BASHEKIM"
  | "MUDUR"
  | "DOKTOR"
  | "HEMSIRE"
  | "EBE"
  | "LABORANT"
  | "TEMIZLIK_PERSONELI"
  | "GUVENLIK"
  | "IDARI_PERSONEL";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const BASHEKIM_NAV: NavItem[] = [
  { label: "Dashboard", path: "/bashekim", icon: LayoutDashboard },
  { label: "Personel", path: "/bashekim/personel", icon: IdCard },
  { label: "Departmanlar", path: "/bashekim/departmanlar", icon: Building2 },
  { label: "Randevular", path: "/bashekim/randevular", icon: CalendarClock },
  { label: "Nöbet Çizelgesi", path: "/bashekim/nobet", icon: CalendarDays },
  { label: "Temizlik Görevleri", path: "/bashekim/temizlik", icon: Sparkles },
  { label: "Şikayet/Öneriler", path: "/bashekim/sikayet", icon: MessageSquareWarning },
];

const HEMSIRE_NAV: NavItem[] = [
  { label: "Dashboard", path: "/hemsire", icon: LayoutDashboard },
  {
    label: "Departman Randevuları",
    path: "/hemsire/departman-randevulari",
    icon: CalendarClock,
  },
  { label: "Nöbet Çizelgem", path: "/hemsire/nobet", icon: CalendarDays },
];

export const NAV_ITEMS: Record<Rol, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Kullanıcılar", path: "/admin/kullanicilar", icon: Users },
    { label: "Personel", path: "/admin/personel", icon: IdCard },
    { label: "Departmanlar", path: "/admin/departmanlar", icon: Building2 },
    { label: "Doktorlar", path: "/admin/doktorlar", icon: Stethoscope },
    { label: "Randevular", path: "/admin/randevular", icon: CalendarClock },
    { label: "Raporlar", path: "/admin/raporlar", icon: BarChart3 },
    { label: "Ayarlar", path: "/admin/ayarlar", icon: Settings },
  ],
  BASHEKIM: BASHEKIM_NAV,
  MUDUR: [
    { label: "Dashboard", path: "/mudur", icon: LayoutDashboard },
    { label: "Personel", path: "/mudur/personel", icon: IdCard },
    { label: "Departmanlar", path: "/mudur/departmanlar", icon: Building2 },
    { label: "Randevular", path: "/mudur/randevular", icon: CalendarClock },
    { label: "Nöbet Çizelgesi", path: "/mudur/nobet", icon: CalendarDays },
    { label: "Temizlik Görevleri", path: "/mudur/temizlik", icon: Sparkles },
    { label: "Şikayet/Öneriler", path: "/mudur/sikayet", icon: MessageSquareWarning },
  ],
  DOKTOR: [
    { label: "Dashboard", path: "/doktor", icon: LayoutDashboard },
    { label: "Randevularım", path: "/doktor/randevularim", icon: CalendarClock },
    { label: "Muayene ekranı", path: "/doktor/muayene", icon: HeartPulse },
    { label: "Tetkik iste", path: "/doktor/tetkik-iste", icon: FlaskConical },
    { label: "Hastalarım", path: "/doktor/hastalarim", icon: Users },
    { label: "Profilim", path: "/doktor/profilim", icon: UserCircle },
  ],
  HEMSIRE: HEMSIRE_NAV,
  EBE: [
    { label: "Dashboard", path: "/ebe", icon: LayoutDashboard },
    {
      label: "Departman Randevuları",
      path: "/ebe/departman-randevulari",
      icon: CalendarClock,
    },
    { label: "Nöbet Çizelgem", path: "/ebe/nobet", icon: CalendarDays },
  ],
  LABORANT: [
    { label: "Dashboard", path: "/laborant", icon: LayoutDashboard },
    { label: "Bekleyen Tetkikler", path: "/laborant/bekleyen", icon: ClipboardList },
    {
      label: "Tetkik Sonuç Girişi",
      path: "/laborant/tetkik-sonuc-girisi",
      icon: FlaskConical,
    },
  ],
  TEMIZLIK_PERSONELI: [
    { label: "Dashboard", path: "/temizlik", icon: LayoutDashboard },
    { label: "Görevlerim", path: "/temizlik/gorevlerim", icon: Sparkles },
  ],
  GUVENLIK: [
    { label: "Dashboard", path: "/guvenlik", icon: Shield },
  ],
  IDARI_PERSONEL: [
    { label: "Dashboard", path: "/idari", icon: LayoutDashboard },
  ],
};

export const ROL_ETIKET: Record<Rol | "HASTA", string> = {
  ADMIN: "Yönetici",
  BASHEKIM: "Başhekim",
  MUDUR: "Müdür",
  DOKTOR: "Doktor",
  HEMSIRE: "Hemşire",
  EBE: "Ebe",
  LABORANT: "Laborant",
  TEMIZLIK_PERSONELI: "Temizlik Personeli",
  GUVENLIK: "Güvenlik",
  IDARI_PERSONEL: "İdari Personel",
  HASTA: "Hasta",
};
