import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "src/infra";
import { useLocation } from "src/navigation";

interface HeaderProps {
	/** Opens the mobile sidebar drawer (hamburger, shown only below lg). */
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const { t, i18n } = useTranslation(["common"]);
	const [location] = useLocation();
	const storeName = useAppSelector((state) => state.store.data?.name);

	// Page key from the URL path's first segment, kebab→camel
	// ("/admin/delivery-notes" → "deliveryNotes"), matching the sidebar labels in
	// `common`. Sub-pages without a label (createOrder, editProduct, …) fall back to
	// the store name — i18n.exists guards it so we don't log a missingKey per nav.
	const section = location.pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean)[0] ?? "";
	const pageKey = section ? section.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) : "dashboard";
	const title = i18n.exists(pageKey) ? t(pageKey as any) : storeName ?? "";

	return (
		<header className="sticky top-0 z-30 flex items-center justify-between gap-4 h-16 px-4 lg:px-8 bg-[var(--surface)] border-b border-[var(--border)]">
			{/* Start (RTL: right) — hamburger + page title */}
			<div className="flex items-center gap-3">
				<Button
					isIconOnly
					variant="ghost"
					size="sm"
					className="lg:hidden"
					onPress={onMenuClick}
					aria-label="פתיחת תפריט"
				>
					<Icon icon="lucide:menu" width={20} height={20} />
				</Button>
				<h1 className="text-lg lg:text-xl font-extrabold tracking-tight text-[var(--foreground)]">
					{title}
				</h1>
			</div>

			{/* End (RTL: left) — notifications + user */}
			<div className="flex items-center gap-3">
				<Button isIconOnly variant="ghost" size="sm" aria-label="התראות">
					<Icon icon="lucide:bell" width={20} height={20} />
				</Button>
				<div className="flex items-center gap-2.5">
					<div
						className="size-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0"
						style={{ backgroundImage: "linear-gradient(135deg, var(--accent), var(--brand-secondary))" }}
					>
						מ
					</div>
					<div className="hidden sm:flex flex-col leading-tight">
						<b className="text-[13px] text-[var(--foreground)]">מנהל מערכת</b>
						{storeName && <span className="text-[11px] text-[var(--muted)]">{storeName}</span>}
					</div>
				</div>
			</div>
		</header>
	);
}
