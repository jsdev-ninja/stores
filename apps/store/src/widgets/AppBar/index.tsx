import { useState } from "react";
import { Button, Dropdown, Tooltip } from "@heroui/react";
import { Link, TLinkTo, navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { useStore } from "src/domains/Store";
import { WebsiteLogo } from "../WebsiteLogo";
import { OrgPicker } from "../OrgPicker/OrgPicker";

// Stores whose personal area opens as a popup dialog instead of a full page.
const ACCOUNT_MODAL_STORES = ["balasistore_store", "tester_store"];

export function AppBar() {
  const { t } = useTranslation(["common"]);

  const appApi = useAppApi();

  const user = useAppSelector((state) => state.user.user);
  const store = useStore();
  const useAccountModal = !!store && ACCOUNT_MODAL_STORES.includes(store.id);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { name: string; to: TLinkTo }[] = [];

  if (!user?.isAnonymous) {
    navLinks.push({
      name: t("navLinks.saved"),
      to: "store.favoritesProducts",
    });
    navLinks.push({
      name: t("navLinks.discounts"),
      to: "store.discounts",
    });
  }

  const dropdownItems = [
    {
      key: "profile",
      label: t("profile"),
      action: () =>
        useAccountModal
          ? modalApi.openModal("accountModal")
          : navigate({
              to: "store.profile",
            }),
    },
    {
      key: "favorites",
      label: t("favorites"),
      action: () =>
        navigate({
          to: "store.favoritesProducts",
        }),
    },
    {
      key: "discounts",
      label: t("discounts"),
      action: () =>
        navigate({
          to: "store.discounts",
        }),
    },
    {
      key: "orders",
      label: t("orders"),
      action: () =>
        navigate({
          to: "store.orders",
        }),
    },
    {
      key: "logout",
      label: t("logout"),
      action: () => appApi.system.auth.logout(),
    },
  ];

  if (user?.admin) {
    dropdownItems.unshift({
      key: "admin",
      label: t("admin"),
      action: () =>
        navigate({
          to: "admin",
        }),
    });
  }

  const text = user && !user.isAnonymous ? t("logout") : t("login");

  const onClick =
    user && !user.isAnonymous
      ? () => FirebaseApi.auth.logout()
      : () => modalApi.openModal("authModal");

  return (
    <header className="border-b border-default-200 dark:border-default-700 bg-background">
      <nav className="flex items-center justify-between gap-4 h-16 px-4 mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2  px-5 h-16 shrink-0 border-b border-white/10">
          <div className="h-full w-40">
            <WebsiteLogo />
          </div>
        </div>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-4 list-none m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                params={undefined as any}
                to={link.to}
                className="text-foreground"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* End actions */}
        <ul className="flex items-center gap-2 list-none m-0 p-0">
          <li>
            <OrgPicker />
          </li>
          <li>
            {!!user && !user.isAnonymous ? (
              <Dropdown>
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="flex items-center gap-1 cursor-pointer"
                    aria-label="Open user menu"
                  >
                    <Icon name="userCircle" size="lg" />
                    {user?.admin && <AdminBadge label={t("admin")} />}
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      const item = dropdownItems.find(
                        (item) => item.key === key,
                      );
                      item?.action();
                    }}
                  >
                    {dropdownItems.map((item) => (
                      <Dropdown.Item
                        key={item.key}
                        id={item.key}
                        textValue={item.label}
                      >
                        {item.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <Button size="sm" variant="primary" onClick={onClick}>
                {text}
              </Button>
            )}
          </li>
          {/* Mobile hamburger */}
          <li className="md:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1"
            >
              <Icon name="hamburger" size="md" />
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile nav menu */}
      {mobileMenuOpen && navLinks.length > 0 && (
        <ul className="md:hidden flex flex-col border-t border-default-200 dark:border-default-700 px-4 py-2 gap-2 list-none m-0">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                params={undefined as any}
                to={link.to}
                className="block py-1 text-foreground"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

type AdminBadgeProps = {
  label: string;
};

function AdminBadge({ label }: AdminBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(label).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-md bg-default-100 dark:bg-default-800 ps-3 pe-2 py-1 font-mono text-sm">
      <code>{label}</code>
      <Tooltip>
        <Tooltip.Trigger>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="flex items-center text-default-500 hover:text-default-700 transition-colors"
          >
            {/* Heroicons clipboard-document-check / clipboard-document */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              {copied ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                />
              )}
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content placement="top">
          {copied ? "Copied!" : "Copy to clipboard"}
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
