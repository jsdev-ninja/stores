import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Link, routes, useLocation } from "src/navigation";
import { RouteKeys } from "src/lib/router";
import { WebsiteLogo } from "src/widgets/WebsiteLogo";

const sidebarCategories = [
  {
    titleKey: "dashboard",
    items: [
      {
        name: "dashboard",
        path: "admin" as RouteKeys<typeof routes>,
        icon: "lucide:layout-dashboard",
      },
    ],
  },
  {
    titleKey: "manageStore",
    items: [
      {
        name: "products",
        path: "admin.products" as RouteKeys<typeof routes>,
        icon: "lucide:package",
      },
      {
        name: "categories",
        path: "admin.categories" as RouteKeys<typeof routes>,
        icon: "lucide:folder-tree",
      },
      {
        name: "discounts",
        path: "admin.discounts" as RouteKeys<typeof routes>,
        icon: "lucide:percent",
      },
      {
        name: "inventoryCertificate",
        path: "admin.inventoryCertificate" as RouteKeys<typeof routes>,
        icon: "lucide:file-check",
      },
      {
        name: "suppliers",
        path: "admin.suppliers" as RouteKeys<typeof routes>,
        icon: "lucide:truck",
      },
    ],
  },
  {
    titleKey: "manageUsers",
    items: [
      {
        name: "users",
        path: "admin.users" as RouteKeys<typeof routes>,
        icon: "lucide:users",
      },
      {
        name: "organizations",
        path: "admin.organizations" as RouteKeys<typeof routes>,
        icon: "lucide:building-2",
      },
      {
        name: "organizationGroups",
        path: "admin.organizationGroups" as RouteKeys<typeof routes>,
        icon: "lucide:folder-tree",
      },
    ],
  },
  {
    titleKey: "manageOrders",
    items: [
      {
        name: "orders",
        path: "admin.orders" as RouteKeys<typeof routes>,
        icon: "lucide:shopping-cart",
      },
    ],
  },
  {
    titleKey: "billing",
    items: [
      {
        name: "invoices",
        path: "admin.invoices" as RouteKeys<typeof routes>,
        icon: "lucide:receipt",
      },
      {
        name: "deliveryNotes",
        path: "admin.deliveryNotes" as RouteKeys<typeof routes>,
        icon: "lucide:file-text",
      },
      {
        name: "budget",
        path: "admin.budget" as RouteKeys<typeof routes>,
        icon: "lucide:wallet",
      },
    ],
  },
  {
    titleKey: "adminSettings",
    items: [
      {
        name: "settings",
        path: "admin.settings" as RouteKeys<typeof routes>,
        icon: "lucide:settings",
      },
    ],
  },
];

interface SidebarProps {
  /** Mobile drawer open state. On lg+ the sidebar is always visible (CSS). */
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { t } = useTranslation(["common"]);
  const [location] = useLocation();

  return (
    <aside
      aria-label={t("admin")}
      className={[
        // Mobile: fixed off-canvas drawer on the right (RTL). Desktop: sticky in-flow column.
        "fixed lg:sticky top-0 right-0 self-start z-50 h-screen w-60 shrink-0",
        "flex flex-col overflow-y-auto",
        "bg-[var(--background-inverse)] text-white/75",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-16 shrink-0 border-b border-white/10">
        <div className="h-full w-full">
          <WebsiteLogo />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        {sidebarCategories.map((category) => (
          <div key={category.titleKey} className="mb-5">
            <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {t(category.titleKey as any)}
            </h3>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    params={{}}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon
                      icon={item.icon}
                      width={18}
                      height={18}
                      className="shrink-0 opacity-90"
                    />
                    <span className="flex-1">{t(item.name as any)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
