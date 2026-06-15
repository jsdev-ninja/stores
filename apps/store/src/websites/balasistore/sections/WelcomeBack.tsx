/**
 * Personalized "welcome back" greeting band — shown to a logged-in
 * (non-anonymous) Balasi customer at the top of every storefront page
 * (rendered site-wide from StoreLayout).
 * Mirrors the original Balasi design's return-visitor banner.
 *
 * Dismiss is in-memory only: the X collapses the band to a small reopen
 * pill, and a full page refresh brings the greeting back.
 * UI-only, theme tokens; no business logic. Returns null for non-Balasi stores.
 */

import { useState } from "react";
import { useUser } from "src/domains/user";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { modalApi } from "src/infra/modals";

const ORANGE = "var(--brand-secondary)"; // design --pop

const isBalasiStore = (id?: string) => id === "balasistore_store" || id === "tester_store";

export default function WelcomeBack() {
	const store = useStore();
	const user = useUser();
	const [hidden, setHidden] = useState(false);

	const isLoggedIn = !!user && !user.isAnonymous;
	if (!isBalasiStore(store?.id) || !isLoggedIn) return null;

	const name = user.displayName || user.email?.split("@")[0] || "";

	// Collapsed: a small pill the customer can click to bring the greeting back
	// (without refreshing). A refresh resets `hidden` and shows the full band.
	if (hidden) {
		return (
			<div
				className="flex justify-center px-6 py-1.5"
				style={{ background: "linear-gradient(135deg, var(--foreground), #0f4421)" }}
				dir="rtl"
			>
				<button
					type="button"
					onClick={() => setHidden(false)}
					aria-label="הצג שוב את הודעת הפתיחה"
					className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent px-2 py-1 text-[12px] font-medium text-white/70 hover:text-white"
				>
					<span aria-hidden>👋</span>
					ברוך שובך
				</button>
			</div>
		);
	}

	return (
		<div
			className="relative flex flex-wrap items-center justify-center gap-[18px] px-6 py-[14px] text-[13.5px] font-medium tracking-[0.02em] text-white"
			style={{ background: "linear-gradient(135deg, var(--foreground), #0f4421)" }}
			dir="rtl"
		>
			<span className="text-[18px]" aria-hidden>
				👋
			</span>
			<span>
				ברוך שובך
				{name && (
					<>
						, <b style={{ color: "var(--color-promo)" }}>{name}</b>
					</>
				)}
				! נעים לראות אותך שוב.
			</span>

			<button
				type="button"
				onClick={() => modalApi.openModal("accountModal")}
				className="cursor-pointer border-0 px-4 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-white"
				style={{ background: ORANGE }}
			>
				לאזור האישי
			</button>
			<button
				type="button"
				onClick={() => navigate({ to: "store.catalog" })}
				className="cursor-pointer border-0 bg-white/[0.12] px-4 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-white"
			>
				הזמנה חדשה
			</button>

			<button
				type="button"
				onClick={() => setHidden(true)}
				aria-label="סגור"
				className="cursor-pointer border-0 bg-transparent px-[6px] text-[18px] leading-none text-white/60 hover:text-white"
			>
				×
			</button>
		</div>
	);
}
