/**
 * Balasi storefront "אזור אישי" (personal area) — store-scoped redesign that
 * mirrors the original Balasi personal-area layout, built ONLY on data that
 * already exists in the system (profile, orders, favorites).
 *
 * Intentionally OMITTED (require backend/business logic — pending Philip):
 *  - Standing weekly recurring order ("הזמנה קבועה שבועית")
 *  - Customer number ("מספר לקוח")
 *  - Personalized recommendations ("מומלץ עבורכם")
 *
 * Personal-details view/edit reuses the shared ProfileView/ProfileForm so the
 * existing "edit my details" functionality is preserved (no regression).
 */

import React from "react";
import { toast } from "@heroui/react";
import { TOrder, TProfile } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";

import { useProfile } from "src/domains/profile";
import { useUser } from "src/domains/user";
import { useFavoriteProducts } from "src/domains/favoriteProducts";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { ProfileView } from "src/pages/store/ProfilePage/ProfileView";
import { ProfileForm } from "src/pages/store/ProfilePage/ProfileForm";

const ORANGE = "var(--brand-secondary)"; // design --pop
const GREEN = "var(--accent)";

function initials(name: string) {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "★";
}

export default function BalasiProfilePage() {
	const { t } = useTranslation(["profilePage", "common", "ordersPage"]);
	const appApi = useAppApi();

	const profile = useProfile();
	const user = useUser();
	const favorites = useFavoriteProducts();
	const orders = useAppSelector((state) => state.orders.orders);

	const [isEditing, setIsEditing] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);

	const name = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "";

	// Orders placed in the current calendar month.
	const now = new Date();
	const ordersThisMonth = orders.filter((o) => {
		const d = new Date(o.date);
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
	}).length;

	// Most recent orders first.
	const recentOrders = [...orders].sort((a, b) => b.date - a.date);

	async function handleSave(updated: TProfile) {
		setIsSaving(true);
		try {
			await appApi.user.profileUpdate({ newProfile: updated });
			setIsEditing(false);
			toast.success(t("profilePage:updateSuccessTitle" as any), {
				description: t("profilePage:updateSuccessDescription" as any),
			});
		} catch {
			toast.danger(t("profilePage:updateFailedTitle" as any), {
				description: t("profilePage:updateFailedDescription" as any),
			});
		} finally {
			setIsSaving(false);
		}
	}

	if (!profile) return null;

	return (
		<div className="min-h-screen bg-[var(--background)] pb-16" dir="rtl">
			{/* ---- Header band ------------------------------------------------ */}
			<header
				className="relative overflow-hidden px-6 py-10 text-white"
				style={{ background: "linear-gradient(135deg, var(--foreground), #0f4421)" }}
			>
				<div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-6">
					<div className="flex items-center gap-5">
						<div
							className="flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-black text-white"
							style={{ background: ORANGE }}
							aria-hidden
						>
							{initials(name)}
						</div>
						<div>
							<div className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/70">
								שלום{name ? `, ${name}` : ""}
							</div>
							<h1 className="mt-1 text-[34px] font-black leading-none tracking-[-0.03em]">
								אזור אישי
							</h1>
						</div>
					</div>

					<button
						type="button"
						onClick={() => appApi.system.auth.logout()}
						className="cursor-pointer rounded-md border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.04em] text-white transition-colors hover:bg-white/20"
					>
						{t("common:logout")}
					</button>
				</div>
			</header>

			<main className="mx-auto max-w-[900px] px-4">
				{/* ---- Stats --------------------------------------------------- */}
				<section className="-mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
					<StatCard label="הזמנות החודש" value={ordersThisMonth} accent={GREEN} />
					<StatCard label="מועדפים" value={favorites.length} accent={ORANGE} />
					<StatCard label="סה״כ הזמנות" value={orders.length} accent={GREEN} />
				</section>

				{/* ---- Quick actions ------------------------------------------ */}
				<section className="mt-10">
					<h2 className="mb-4 text-[15px] font-extrabold tracking-[0.02em] text-[var(--foreground)]">
						פעולות מהירות
					</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<QuickAction
							icon="🛒"
							title="הזמנה חדשה"
							subtitle="גלשו בקטלוג והזמינו"
							onClick={() => navigate({ to: "store.catalog" })}
						/>
						<QuickAction
							icon="📦"
							title="ההזמנות שלי"
							subtitle="מעקב והיסטוריה"
							onClick={() => navigate({ to: "store.orders" })}
						/>
						<QuickAction
							icon="❤️"
							title="המועדפים שלי"
							subtitle="המוצרים שאהבתם"
							onClick={() => navigate({ to: "store.favoritesProducts" })}
						/>
					</div>
				</section>

				{/* ---- Previous orders ----------------------------------------- */}
				<section className="mt-10">
					<h2 className="mb-4 text-[15px] font-extrabold tracking-[0.02em] text-[var(--foreground)]">
						הזמנות קודמות
					</h2>

					{recentOrders.length === 0 ? (
						<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[14px] text-[var(--muted)]">
							עדיין אין הזמנות. זה הזמן להתחיל 🙂
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{recentOrders.map((order) => (
								<OrderRow key={order.id} order={order} />
							))}
						</div>
					)}
				</section>

				{/* ---- Personal details (preserves edit functionality) -------- */}
				<section className="mt-10">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-[15px] font-extrabold tracking-[0.02em] text-[var(--foreground)]">
							פרטים אישיים
						</h2>
						{!isEditing && (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="cursor-pointer text-[13px] font-bold underline"
								style={{ color: GREEN }}
							>
								עריכת פרטים
							</button>
						)}
					</div>

					<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
						{isEditing ? (
							<ProfileForm
								profile={profile}
								onSave={handleSave}
								onCancel={() => setIsEditing(false)}
								isSaving={isSaving}
							/>
						) : (
							<ProfileView profile={profile} />
						)}
					</div>
				</section>
			</main>
		</div>
	);
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
	return (
		<div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-sm">
			<div className="text-[32px] font-black leading-none" style={{ color: accent }}>
				{value}
			</div>
			<div className="mt-2 text-[12px] font-semibold tracking-[0.02em] text-[var(--muted)]">
				{label}
			</div>
		</div>
	);
}

function QuickAction({
	icon,
	title,
	subtitle,
	onClick,
}: {
	icon: string;
	title: string;
	subtitle: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--brand-secondary)] hover:shadow-md"
		>
			<span className="text-[26px]" aria-hidden>
				{icon}
			</span>
			<span className="text-[14px] font-extrabold text-[var(--foreground)]">{title}</span>
			<span className="text-[11.5px] text-[var(--muted)]">{subtitle}</span>
		</button>
	);
}

function OrderRow({ order }: { order: TOrder }) {
	const appApi = useAppApi();
	const itemsCount = order.cart.items.length;

	return (
		<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
			<div className="min-w-[160px]">
				<div className="text-[15px] font-extrabold text-[var(--foreground)]">
					BLS-{order.id.slice(0, 8).toUpperCase()}
				</div>
				<div className="mt-1 text-[12.5px] text-[var(--muted)]">
					<DateView date={order.date} /> · {itemsCount} פריטים ·{" "}
					<Price price={order.cart.cartTotal} />
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => navigate({ to: "store.orderPage", params: { id: order.id } })}
					className="cursor-pointer rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-[12.5px] font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--default)]"
				>
					צפה
				</button>
				<button
					type="button"
					onClick={() => appApi.user.createCartFromOrder({ order })}
					className="cursor-pointer rounded-md border-0 px-4 py-2 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
					style={{ background: "var(--foreground)" }}
				>
					הזמן שוב
				</button>
			</div>
		</div>
	);
}
