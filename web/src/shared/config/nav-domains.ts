import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Building2,
  Settings,
  Shield,
  FileSearch,
} from "lucide-react";
import type { NavGroup, NavItem, Rol } from "@/shared/config/nav-items";
import { NAV_GROUPS, flattenNav } from "@/shared/config/nav-items";

export type NavDomain = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route prefixes that activate this domain (longest match wins). */
  paths: string[];
  groups: NavGroup[];
};

const PILOT_ROLES: Rol[] = ["ADMIN", "BASHEKIM", "MUDUR"];

function pick(items: NavItem[], paths: string[]): NavGroup[] {
  const set = new Set(paths);
  const picked = items.filter((i) => set.has(i.path));
  return picked.length ? [{ items: picked }] : [];
}

function adminDomains(): NavDomain[] {
  const all = flattenNav(NAV_GROUPS.ADMIN);
  const root = "/admin";
  return [
    {
      id: "gosterge",
      label: "Gösterge",
      icon: LayoutDashboard,
      paths: [
        root,
        `${root}/ozet`,
        `${root}/bekleyenler`,
        `${root}/operasyon`,
        `${root}/insan-kaynaklari`,
        `${root}/sistem`,
      ],
      groups: [
        {
          items: [
            { label: "Özet", path: `${root}/ozet`, icon: LayoutDashboard },
            { label: "Bekleyenler", path: `${root}/bekleyenler`, icon: LayoutDashboard },
            { label: "Operasyon", path: `${root}/operasyon`, icon: Building2 },
            { label: "İnsan kaynakları", path: `${root}/insan-kaynaklari`, icon: Users },
            { label: "Sistem", path: `${root}/sistem`, icon: Settings },
          ],
        },
      ],
    },
    {
      id: "ik",
      label: "İnsan & erişim",
      icon: Users,
      paths: [
        `${root}/kullanicilar`,
        `${root}/erisim-onaylari`,
        `${root}/personel`,
        `${root}/doktorlar`,
        `${root}/departmanlar`,
      ],
      groups: pick(all, [
        `${root}/kullanicilar`,
        `${root}/erisim-onaylari`,
        `${root}/personel`,
        `${root}/doktorlar`,
        `${root}/departmanlar`,
      ]),
    },
    {
      id: "hasta",
      label: "Hasta & klinik",
      icon: HeartPulse,
      paths: [
        `${root}/randevular`,
        `${root}/hastalar`,
        `${root}/hasta-mukerrer`,
        `${root}/ozel-kimlik-kayit`,
        `${root}/acil-triyaj`,
        `${root}/muayeneler`,
        `${root}/tetkikler`,
      ],
      groups: pick(all, [
        `${root}/randevular`,
        `${root}/hastalar`,
        `${root}/hasta-mukerrer`,
        `${root}/ozel-kimlik-kayit`,
        `${root}/acil-triyaj`,
        `${root}/muayeneler`,
        `${root}/tetkikler`,
      ]),
    },
    {
      id: "operasyon",
      label: "Tesis & operasyon",
      icon: Building2,
      paths: [
        `${root}/nobet`,
        `${root}/yatak-yonetimi`,
        `${root}/ameliyathane`,
        `${root}/radyoloji`,
        `${root}/temizlik`,
      ],
      groups: pick(all, [
        `${root}/nobet`,
        `${root}/yatak-yonetimi`,
        `${root}/ameliyathane`,
        `${root}/radyoloji`,
        `${root}/temizlik`,
      ]),
    },
    {
      id: "sistem",
      label: "Sistem & rapor",
      icon: Settings,
      paths: [
        `${root}/sikayet`,
        `${root}/raporlar`,
        `${root}/ayarlar`,
        `${root}/denetim`,
        `${root}/rbac`,
      ],
      groups: [
        {
          items: [
            ...pick(all, [`${root}/sikayet`, `${root}/raporlar`, `${root}/ayarlar`])[0]?.items ?? [],
            { label: "RBAC / yetki", path: `${root}/rbac`, icon: Shield },
            { label: "Denetim", path: `${root}/denetim`, icon: FileSearch },
          ],
        },
      ],
    },
  ];
}

function yonetimDomains(root: "/bashekim" | "/mudur", includeKurumsal: boolean): NavDomain[] {
  const rol = root === "/bashekim" ? "BASHEKIM" : "MUDUR";
  const all = flattenNav(NAV_GROUPS[rol]);

  const domains: NavDomain[] = [
    {
      id: "gosterge",
      label: "Gösterge",
      icon: LayoutDashboard,
      paths: [
        root,
        `${root}/ozet`,
        `${root}/bekleyenler`,
        `${root}/operasyon`,
        ...(includeKurumsal ? [`${root}/kurumsal`] : []),
      ],
      groups: [
        {
          items: [
            { label: "Özet", path: `${root}/ozet`, icon: LayoutDashboard },
            { label: "Bekleyenler", path: `${root}/bekleyenler`, icon: LayoutDashboard },
            { label: "Operasyon", path: `${root}/operasyon`, icon: Building2 },
            ...(includeKurumsal
              ? [{ label: "Kurumsal", path: `${root}/kurumsal`, icon: Building2 }]
              : []),
          ],
        },
      ],
    },
    {
      id: "ik",
      label: "İnsan & erişim",
      icon: Users,
      paths: [
        `${root}/erisim-onaylari`,
        `${root}/personel`,
        `${root}/doktorlar`,
        `${root}/departmanlar`,
      ],
      groups: pick(all, [
        `${root}/erisim-onaylari`,
        `${root}/personel`,
        `${root}/doktorlar`,
        `${root}/departmanlar`,
      ]),
    },
    {
      id: "hasta",
      label: "Hasta & klinik",
      icon: HeartPulse,
      paths: [
        `${root}/randevular`,
        `${root}/hastalar`,
        `${root}/hasta-mukerrer`,
        `${root}/acil-triyaj`,
        `${root}/muayeneler`,
        `${root}/tetkikler`,
        ...(includeKurumsal ? [`${root}/klinik-onaylar`] : []),
      ],
      groups: pick(all, [
        `${root}/randevular`,
        `${root}/hastalar`,
        `${root}/hasta-mukerrer`,
        `${root}/acil-triyaj`,
        `${root}/muayeneler`,
        `${root}/tetkikler`,
        ...(includeKurumsal ? [`${root}/klinik-onaylar`] : []),
      ]),
    },
    {
      id: "operasyon",
      label: "Tesis & operasyon",
      icon: Building2,
      paths: [
        `${root}/nobet`,
        `${root}/yatak-yonetimi`,
        `${root}/ameliyathane`,
        `${root}/radyoloji`,
        `${root}/temizlik`,
      ],
      groups: pick(all, [
        `${root}/nobet`,
        `${root}/yatak-yonetimi`,
        `${root}/ameliyathane`,
        `${root}/radyoloji`,
        `${root}/temizlik`,
      ]),
    },
    {
      id: "sistem",
      label: "Sistem & rapor",
      icon: Settings,
      paths: [
        `${root}/sikayet`,
        `${root}/raporlar`,
        `${root}/ayarlar`,
        `${root}/denetim`,
        `${root}/yetki-matrisi`,
      ],
      groups: pick(all, [
        `${root}/sikayet`,
        `${root}/raporlar`,
        `${root}/ayarlar`,
        ...(includeKurumsal
          ? [`${root}/denetim`, `${root}/yetki-matrisi`]
          : []),
      ]),
    },
  ];

  if (includeKurumsal) {
    domains.splice(4, 0, {
      id: "kurumsal",
      label: "Kurumsal",
      icon: Building2,
      paths: [
        `${root}/mhrs-kapasite`,
        `${root}/entegrasyonlar`,
        `${root}/eczane`,
        `${root}/faturalandirma`,
        `${root}/doner-sermaye`,
        `${root}/yetki-duyurulari`,
        `${root}/sistem-gozetim`,
      ],
      groups: pick(all, [
        `${root}/mhrs-kapasite`,
        `${root}/entegrasyonlar`,
        `${root}/eczane`,
        `${root}/faturalandirma`,
        `${root}/doner-sermaye`,
        `${root}/yetki-duyurulari`,
        `${root}/sistem-gozetim`,
      ]),
    });
  }

  return domains;
}

export const NAV_DOMAINS: Partial<Record<Rol, NavDomain[]>> = {
  ADMIN: adminDomains(),
  BASHEKIM: yonetimDomains("/bashekim", true),
  MUDUR: yonetimDomains("/mudur", false),
};

export function usesDomainNav(rol: Rol): boolean {
  return PILOT_ROLES.includes(rol);
}

export function domainsForRole(rol: Rol): NavDomain[] | null {
  return NAV_DOMAINS[rol] ?? null;
}

/** Longest matching path prefix selects the active domain. */
export function resolveNavDomain(
  pathname: string,
  domains: NavDomain[],
): NavDomain {
  let best: NavDomain | null = null;
  let bestLen = -1;

  for (const domain of domains) {
    for (const prefix of domain.paths) {
      const match =
        pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (match && prefix.length > bestLen) {
        best = domain;
        bestLen = prefix.length;
      }
    }
    for (const item of flattenNav(domain.groups)) {
      const p = item.path;
      const match = pathname === p || pathname.startsWith(`${p}/`);
      if (match && p.length > bestLen) {
        best = domain;
        bestLen = p.length;
      }
    }
  }

  return best ?? domains[0];
}

export function flattenDomains(domains: NavDomain[]): NavItem[] {
  return domains.flatMap((d) => flattenNav(d.groups));
}
