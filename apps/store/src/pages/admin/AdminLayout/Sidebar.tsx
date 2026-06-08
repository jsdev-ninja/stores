import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Link, routes, useLocation } from "src/navigation";
import { RouteKeys } from "src/lib/router";
import { FirebaseApi } from "src/lib/firebase";
import { WebsiteLogo } from "src/widgets/WebsiteLogo";

// Main navigation — a single flat list, ordered to match the store design.
const navItems = [
  {
    labelKey: "nav.dashboard",
    path: "admin" as RouteKeys<typeof routes>,
    icon: "lucide:layout-dashboard",
  },
  {
    labelKey: "nav.orders",
    path: "admin.orders" as RouteKeys<typeof routes>,
    icon: "lucide:shopping-cart",
  },
  {
    labelKey: "nav.organizations",
    path: "admin.organizations" as RouteKeys<typeof routes>,
    icon: "lucide:building-2",
  },
  {
    labelKey: "nav.users",
    path: "admin.users" as RouteKeys<typeof routes>,
    icon: "lucide:users",
  },
  {
    labelKey: "nav.products",
    path: "admin.products" as RouteKeys<typeof routes>,
    icon: "lucide:package",
  },
  {
    labelKey: "nav.categories",
    path: "admin.categories" as RouteKeys<typeof routes>,
    icon: "lucide:folder-tree",
  },
  {
    labelKey: "nav.subCategories",
    path: "admin.organizationGroups" as RouteKeys<typeof routes>,
    icon: "lucide:list-tree",
  },
  {
    labelKey: "nav.discounts",
    path: "admin.discounts" as RouteKeys<typeof routes>,
    icon: "lucide:percent",
  },
  {
    labelKey: "nav.suppliers",
    path: "admin.suppliers" as RouteKeys<typeof routes>,
    icon: "lucide:truck",
  },
  {
    labelKey: "nav.inventoryCertificate",
    path: "admin.inventoryCertificate" as RouteKeys<typeof routes>,
    icon: "lucide:clipboard-list",
  },
  {
    labelKey: "nav.deliveryNotes",
    path: "admin.deliveryNotes" as RouteKeys<typeof routes>,
    icon: "lucide:file-text",
  },
  {
    labelKey: "nav.invoices",
    path: "admin.invoices" as RouteKeys<typeof routes>,
    icon: "lucide:receipt",
  },
  {
    labelKey: "nav.budget",
    path: "admin.budget" as RouteKeys<typeof routes>,
    icon: "lucide:wallet",
  },
];

// Footer — separated from the main list by a divider.
const footerItems = [
  {
    labelKey: "nav.settings",
    path: "admin.settings" as RouteKeys<typeof routes>,
    icon: "lucide:settings",
  },
];

interface SidebarProps {
  /** Mobile drawer open state. On lg+ the sidebar is always visible (CSS). */
  isOpen: boolean;
  /** Number of new orders since the admin last viewed the orders screen. */
  newOrdersCount?: number;
}

export function Sidebar({ isOpen, newOrdersCount = 0 }: SidebarProps) {
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
      <nav className="flex-1 flex flex-col px-3 py-4">
        <div className="space-y-0.5">
          {navItems.map((item) => {
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
                <span className="flex-1">{t(item.labelKey as any)}</span>
                {item.path === "admin.orders" && newOrdersCount > 0 && (
                  <span
                    aria-label={t("nav.newOrdersBadge" as any, {
                      count: newOrdersCount,
                      defaultValue: "{{count}} הזמנות חדשות",
                    })}
                    className="shrink-0 min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-[var(--danger)] text-white text-[11px] font-bold leading-none"
                  >
                    {newOrdersCount > 99 ? "99+" : newOrdersCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider before settings + logout */}
        <div className="my-3 border-t border-white/10" />

        <div className="space-y-0.5">
          {footerItems.map((item) => {
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
                <span className="flex-1">{t(item.labelKey as any)}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => FirebaseApi.auth.logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-white/75 hover:bg-white/10 hover:text-white"
          >
            <Icon
              icon="lucide:log-out"
              width={18}
              height={18}
              className="shrink-0 opacity-90"
            />
            <span className="flex-1 text-start">{t("nav.logout" as any)}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
