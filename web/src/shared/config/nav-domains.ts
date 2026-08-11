import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Building2,
  Settings,
  Shield,
  FileSearch,
  ListTodo,
  Scan,
  UserCircle,
  ClipboardList,
  FlaskConical,
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

const ALL_ROLES: Rol[] = [
  "ADMIN",
  "BASHEKIM",
  "MUDUR",
  "DOKTOR",
  "HEMSIRE",
  "EBE",
  "LABORANT",
  "RADYOLOG",
  "TEMIZLIK_PERSONELI",
  "GUVENLIK",
  "IDARI_PERSONEL",
];

function pick(items: NavItem[], paths: string[]): NavGroup[] {
  const set = new Set(paths);
  const picked = items.filter((i) => set.has(i.path));
  return picked.length ? [{ items: picked }] : [];
}

function pathsFromGroup(group: NavGroup): string[] {
  return group.items.map((i) => i.path);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hesapDomain(root: string, extraPaths: string[] = []): NavDomain {
  const paths = Array.from(
    new Set([`${root}/profil`, `${root}/ayarlar`, ...extraPaths]),
  );
  return {
    id: "hesap",
    label: "Hesap",
    icon: Settings,
    paths,
    groups: [
      {
        items: [
          { label: "Profilim", path: `${root}/profil`, icon: UserCircle },
          { label: "Ayarlar", path: `${root}/ayarlar`, icon: Settings },
        ],
      },
    ],
  };
}

function splitFlatRoleDomains(
  rol: Rol,
  root: string,
  sections: {
    id: string;
    label: string;
    icon: LucideIcon;
    paths: string[];
  }[],
  hesapExtra: string[] = [],
): NavDomain[] {
  const all = flattenNav(NAV_GROUPS[rol]);
  const dashboardItems = all.filter((i) => i.path === root);

  const domains: NavDomain[] = [
    {
      id: "gosterge",
      label: "Gösterge",
      icon: LayoutDashboard,
      paths: [root],
      groups: dashboardItems.length
        ? [{ items: dashboardItems }]
        : [{ items: [{ label: "Dashboard", path: root, icon: LayoutDashboard }] }],
    },
    ...sections.map((s) => ({
      id: s.id,
      label: s.label,
      icon: s.icon,
      paths: s.paths,
      groups: pick(all, s.paths),
    })),
    hesapDomain(root, hesapExtra),
  ];

  return domains;
}

function domainsFromLabeledGroups(
  rol: Rol,
  dashboardPath: string,
  hesapExtra: string[] = [],
): NavDomain[] {
  const groups = NAV_GROUPS[rol];
  const root = dashboardPath.split("/").slice(0, 2).join("/") || dashboardPath;
  const domains: NavDomain[] = [];

  for (const group of groups) {
    const paths = pathsFromGroup(group);
    if (paths.length === 0) continue;

    const isDashboard =
      !group.label &&
      paths.length === 1 &&
      paths[0] === dashboardPath;

    const isHesapGroup = paths.every(
      (p) =>
        p.includes("/profil") ||
        p.includes("/ayarlar") ||
        p.includes("/profilim"),
    );

    if (isDashboard) {
      domains.push({
        id: "gosterge",
        label: "Gösterge",
        icon: LayoutDashboard,
        paths,
        groups: [group],
      });
    } else if (isHesapGroup) {
      domains.push({
        id: "hesap",
        label: "Hesap",
        icon: Settings,
        paths: Array.from(new Set([...paths, ...hesapExtra])),
        groups: [group],
      });
    } else {
      domains.push({
        id: slugify(group.label ?? group.items[0].label),
        label: group.label ?? group.items[0].label,
        icon: group.items[0].icon,
        paths,
        groups: [group],
      });
    }
  }

  if (!domains.some((d) => d.id === "hesap")) {
    domains.push(hesapDomain(root, hesapExtra));
  }

  return domains;
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
        `${root}/profil`,
      ],
      groups: [
        {
          items: [
            ...pick(all, [`${root}/sikayet`, `${root}/raporlar`, `${root}/ayarlar`])[0]?.items ?? [],
            { label: "RBAC / yetki", path: `${root}/rbac`, icon: Shield },
            { label: "Denetim", path: `${root}/denetim`, icon: FileSearch },
            { label: "Profilim", path: `${root}/profil`, icon: UserCircle },
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
        ...(includeKurumsal ? [`${root}/kurumsal`, `${root}/analytics`] : []),
      ],
      groups: [
        {
          items: [
            { label: "Özet", path: `${root}/ozet`, icon: LayoutDashboard },
            { label: "Bekleyenler", path: `${root}/bekleyenler`, icon: LayoutDashboard },
            { label: "Operasyon", path: `${root}/operasyon`, icon: Building2 },
            ...(includeKurumsal
              ? [
                  { label: "Analitik", path: `${root}/analytics`, icon: Building2 },
                  { label: "Kurumsal", path: `${root}/kurumsal`, icon: Building2 },
                ]
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
        `${root}/profil`,
      ],
      groups: [
        {
          items: [
            ...pick(all, [`${root}/sikayet`, `${root}/raporlar`, `${root}/ayarlar`])[0]?.items ?? [],
            ...(includeKurumsal
              ? [
                  { label: "Denetim", path: `${root}/denetim`, icon: FileSearch },
                  { label: "Yetki matrisi", path: `${root}/yetki-matrisi`, icon: Shield },
                ]
              : []),
            { label: "Profilim", path: `${root}/profil`, icon: UserCircle },
          ],
        },
      ],
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
        `${root}/zorunlu-bildirimler`,
        `${root}/eczane`,
        `${root}/faturalandirma`,
        `${root}/doner-sermaye`,
        `${root}/yetki-duyurulari`,
        `${root}/sistem-gozetim`,
      ],
      groups: pick(all, [
        `${root}/mhrs-kapasite`,
        `${root}/entegrasyonlar`,
        `${root}/zorunlu-bildirimler`,
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

function clinicalCareDomains(root: "/hemsire" | "/ebe"): NavDomain[] {
  const rol = root === "/hemsire" ? "HEMSIRE" : "EBE";
  return splitFlatRoleDomains(rol, root, [
    {
      id: "klinik",
      label: "Klinik",
      icon: HeartPulse,
      paths: [
        `${root}/servis-takip`,
        `${root}/acil-triyaj`,
        `${root}/yatak-yonetimi`,
        `${root}/ameliyathane`,
        `${root}/hasta-arama`,
        `${root}/order-takip`,
        `${root}/tetkikler`,
        `${root}/epikriz`,
      ],
    },
    {
      id: "is",
      label: "İş & plan",
      icon: ListTodo,
      paths: [
        `${root}/ilac-talep`,
        `${root}/gorevler`,
        `${root}/vardiya-devir`,
        `${root}/departman-randevulari`,
        `${root}/nobet`,
        `${root}/panel`,
      ],
    },
  ]);
}

function laborantDomains(): NavDomain[] {
  const root = "/laborant";
  return splitFlatRoleDomains("LABORANT", root, [
    {
      id: "lab",
      label: "Laboratuvar",
      icon: FlaskConical,
      paths: [`${root}/bekleyen`, `${root}/tetkik-sonuc-girisi`],
    },
  ]);
}

function radyologDomains(): NavDomain[] {
  const root = "/radyolog";
  const all = flattenNav(NAV_GROUPS.RADYOLOG);
  return [
    {
      id: "radyoloji",
      label: "Radyoloji",
      icon: Scan,
      paths: [root, `${root}/radyoloji`],
      groups: pick(all, [`${root}/radyoloji`]),
    },
    hesapDomain(root),
  ];
}

function temizlikDomains(): NavDomain[] {
  const root = "/temizlik";
  return splitFlatRoleDomains("TEMIZLIK_PERSONELI", root, [
    {
      id: "gorevler",
      label: "Görevler",
      icon: ClipboardList,
      paths: [`${root}/gorevlerim`],
    },
  ]);
}

function guvenlikDomains(): NavDomain[] {
  const root = "/guvenlik";
  return splitFlatRoleDomains("GUVENLIK", root, [
    {
      id: "guvenlik",
      label: "Güvenlik",
      icon: Shield,
      paths: [
        `${root}/olaylar`,
        `${root}/ziyaretciler`,
        `${root}/kayip-esya`,
        `${root}/devriyeler`,
        `${root}/refakatci-sorgula`,
        `${root}/nobet`,
        `${root}/sikayet`,
      ],
    },
  ]);
}

function idariDomains(): NavDomain[] {
  const root = "/idari";
  return splitFlatRoleDomains("IDARI_PERSONEL", root, [
    {
      id: "kayit",
      label: "Kayıt",
      icon: HeartPulse,
      paths: [`${root}/hasta-kayit`, `${root}/ozel-kimlik-kayit`],
    },
  ]);
}

function doktorDomains(): NavDomain[] {
  return domainsFromLabeledGroups("DOKTOR", "/doktor", ["/doktor/profil"]);
}

export const NAV_DOMAINS: Record<Rol, NavDomain[]> = {
  ADMIN: adminDomains(),
  BASHEKIM: yonetimDomains("/bashekim", true),
  MUDUR: yonetimDomains("/mudur", false),
  DOKTOR: doktorDomains(),
  HEMSIRE: clinicalCareDomains("/hemsire"),
  EBE: clinicalCareDomains("/ebe"),
  LABORANT: laborantDomains(),
  RADYOLOG: radyologDomains(),
  TEMIZLIK_PERSONELI: temizlikDomains(),
  GUVENLIK: guvenlikDomains(),
  IDARI_PERSONEL: idariDomains(),
};

export function usesDomainNav(rol: Rol): boolean {
  return ALL_ROLES.includes(rol);
}

export function domainsForRole(rol: Rol): NavDomain[] {
  return NAV_DOMAINS[rol];
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
