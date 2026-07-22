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
  UserCheck,
  Network,
  Pill,
  Receipt,
  Wallet,
  Activity,
  FileText,
  Send,
  UsersRound,
  NotebookPen,
  ListTodo,
  Search,
  ListOrdered,
  ScrollText,
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

export type NavGroup = {
  /** Yoksa grup başlığı çizilmez. */
  label?: string;
  items: NavItem[];
};

export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}

function asSingleGroup(items: NavItem[]): NavGroup[] {
  return [{ items }];
}

const ADMIN_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Kullanıcılar", path: "/admin/kullanicilar", icon: Users },
  { label: "Erişim onayları", path: "/admin/erisim-onaylari", icon: UserCheck },
  { label: "Personel", path: "/admin/personel", icon: IdCard },
  { label: "Doktorlar", path: "/admin/doktorlar", icon: Stethoscope },
  { label: "Departmanlar", path: "/admin/departmanlar", icon: Building2 },
  { label: "Randevular", path: "/admin/randevular", icon: CalendarClock },
  { label: "Hastalar", path: "/admin/hastalar", icon: HeartPulse },
  { label: "Muayeneler", path: "/admin/muayeneler", icon: ClipboardList },
  { label: "Tetkikler", path: "/admin/tetkikler", icon: FlaskConical },
  { label: "Nöbet Çizelgesi", path: "/admin/nobet", icon: CalendarDays },
  { label: "Temizlik Görevleri", path: "/admin/temizlik", icon: Sparkles },
  {
    label: "Şikayet/Öneriler",
    path: "/admin/sikayet",
    icon: MessageSquareWarning,
  },
  { label: "Raporlar", path: "/admin/raporlar", icon: BarChart3 },
  { label: "Ayarlar", path: "/admin/ayarlar", icon: Settings },
];

function mudurItems(root: "/mudur"): NavItem[] {
  return [
    { label: "Dashboard", path: root, icon: LayoutDashboard },
    { label: "Personel", path: `${root}/personel`, icon: IdCard },
    { label: "Doktorlar", path: `${root}/doktorlar`, icon: Stethoscope },
    { label: "Departmanlar", path: `${root}/departmanlar`, icon: Building2 },
    { label: "Randevular", path: `${root}/randevular`, icon: CalendarClock },
    { label: "Hastalar", path: `${root}/hastalar`, icon: HeartPulse },
    { label: "Muayeneler", path: `${root}/muayeneler`, icon: ClipboardList },
    { label: "Tetkikler", path: `${root}/tetkikler`, icon: FlaskConical },
    { label: "Nöbet Çizelgesi", path: `${root}/nobet`, icon: CalendarDays },
    { label: "Temizlik Görevleri", path: `${root}/temizlik`, icon: Sparkles },
    {
      label: "Şikayet/Öneriler",
      path: `${root}/sikayet`,
      icon: MessageSquareWarning,
    },
    { label: "Raporlar", path: `${root}/raporlar`, icon: BarChart3 },
    { label: "Ayarlar", path: `${root}/ayarlar`, icon: Settings },
  ];
}

function bashekimGroups(): NavGroup[] {
  const root = "/bashekim";
  return [
    {
      items: [
        { label: "Dashboard", path: root, icon: LayoutDashboard },
        { label: "Erişim onayları", path: `${root}/erisim-onaylari`, icon: UserCheck },
        { label: "Personel", path: `${root}/personel`, icon: IdCard },
        { label: "Doktorlar", path: `${root}/doktorlar`, icon: Stethoscope },
        { label: "Departmanlar", path: `${root}/departmanlar`, icon: Building2 },
        { label: "Randevular", path: `${root}/randevular`, icon: CalendarClock },
        { label: "Hastalar", path: `${root}/hastalar`, icon: HeartPulse },
        { label: "Muayeneler", path: `${root}/muayeneler`, icon: ClipboardList },
        { label: "Tetkikler", path: `${root}/tetkikler`, icon: FlaskConical },
        { label: "Klinik onaylar", path: `${root}/klinik-onaylar`, icon: Activity },
        { label: "MHRS kapasite", path: `${root}/mhrs-kapasite`, icon: Network },
        { label: "Entegrasyonlar", path: `${root}/entegrasyonlar`, icon: Network },
        { label: "Eczane", path: `${root}/eczane`, icon: Pill },
        { label: "Faturalandırma", path: `${root}/faturalandirma`, icon: Receipt },
        { label: "Döner sermaye", path: `${root}/doner-sermaye`, icon: Wallet },
        { label: "Nöbet", path: `${root}/nobet`, icon: CalendarDays },
        { label: "Temizlik", path: `${root}/temizlik`, icon: Sparkles },
        { label: "Şikayet/Öneri", path: `${root}/sikayet`, icon: MessageSquareWarning },
        { label: "Raporlar", path: `${root}/raporlar`, icon: BarChart3 },
        { label: "Ayarlar", path: `${root}/ayarlar`, icon: Settings },
      ],
    },
  ];
}

export const NAV_GROUPS: Record<Rol, NavGroup[]> = {
  ADMIN: asSingleGroup(ADMIN_ITEMS),
  BASHEKIM: bashekimGroups(),
  MUDUR: asSingleGroup(mudurItems("/mudur")),
  DOKTOR: [
    {
      label: "Günlük iş",
      items: [
        { label: "Dashboard", path: "/doktor", icon: LayoutDashboard },
        { label: "Randevularım", path: "/doktor/randevularim", icon: CalendarClock },
        { label: "Muayene", path: "/doktor/muayene", icon: HeartPulse },
      ],
    },
    {
      label: "Klinik",
      items: [
        { label: "Hastalarım", path: "/doktor/hastalarim", icon: Users },
        { label: "Tetkiklerim", path: "/doktor/tetkiklerim", icon: FlaskConical },
        { label: "Epikriz onay", path: "/doktor/epikriz", icon: ScrollText },
        { label: "Reçeteler", path: "/doktor/receteler", icon: Pill },
        { label: "Sevkler", path: "/doktor/sevler", icon: Send },
        { label: "Tıbbi raporlar", path: "/doktor/tibbi-raporlar", icon: FileText },
      ],
    },
    {
      label: "Kurul / konsültasyon",
      items: [
        {
          label: "Konsültasyonlar",
          path: "/doktor/konsultasyonlar",
          icon: UsersRound,
        },
        {
          label: "Sağlık kurulu",
          path: "/doktor/saglik-kurulu",
          icon: ClipboardList,
        },
      ],
    },
    {
      label: "Hesap",
      items: [
        { label: "Profilim", path: "/doktor/profilim", icon: UserCircle },
        { label: "Ayarlar", path: "/doktor/ayarlar", icon: Settings },
      ],
    },
  ],
  HEMSIRE: asSingleGroup([
    { label: "Dashboard", path: "/hemsire", icon: LayoutDashboard },
    {
      label: "Servis Hasta Takip",
      path: "/hemsire/servis-takip",
      icon: HeartPulse,
    },
    { label: "Hasta Arama", path: "/hemsire/hasta-arama", icon: Search },
    { label: "Order Takibi", path: "/hemsire/order-takip", icon: ListOrdered },
    { label: "Tetkikler", path: "/hemsire/tetkikler", icon: FlaskConical },
    { label: "Epikriz", path: "/hemsire/epikriz", icon: ScrollText },
    {
      label: "İlaç/Malzeme Talep",
      path: "/hemsire/ilac-talep",
      icon: Pill,
    },
    { label: "Görevler", path: "/hemsire/gorevler", icon: ListTodo },
    {
      label: "Vardiya Devir",
      path: "/hemsire/vardiya-devir",
      icon: NotebookPen,
    },
    {
      label: "Departman Randevuları",
      path: "/hemsire/departman-randevulari",
      icon: CalendarClock,
    },
    { label: "Nöbet Çizelgem", path: "/hemsire/nobet", icon: CalendarDays },
  ]),
  EBE: asSingleGroup([
    { label: "Dashboard", path: "/ebe", icon: LayoutDashboard },
    {
      label: "Departman Randevuları",
      path: "/ebe/departman-randevulari",
      icon: CalendarClock,
    },
    { label: "Nöbet Çizelgem", path: "/ebe/nobet", icon: CalendarDays },
  ]),
  LABORANT: asSingleGroup([
    { label: "Dashboard", path: "/laborant", icon: LayoutDashboard },
    {
      label: "Bekleyen Tetkikler",
      path: "/laborant/bekleyen",
      icon: ClipboardList,
    },
    {
      label: "Tetkik Sonuç Girişi",
      path: "/laborant/tetkik-sonuc-girisi",
      icon: FlaskConical,
    },
  ]),
  TEMIZLIK_PERSONELI: asSingleGroup([
    { label: "Dashboard", path: "/temizlik", icon: LayoutDashboard },
    { label: "Görevlerim", path: "/temizlik/gorevlerim", icon: Sparkles },
  ]),
  GUVENLIK: asSingleGroup([
    { label: "Dashboard", path: "/guvenlik", icon: Shield },
  ]),
  IDARI_PERSONEL: asSingleGroup([
    { label: "Dashboard", path: "/idari", icon: LayoutDashboard },
  ]),
};

/** Düz liste — geriye uyumluluk / topbar. */
export const NAV_ITEMS: Record<Rol, NavItem[]> = Object.fromEntries(
  (Object.keys(NAV_GROUPS) as Rol[]).map((rol) => [
    rol,
    flattenNav(NAV_GROUPS[rol]),
  ]),
) as Record<Rol, NavItem[]>;

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
