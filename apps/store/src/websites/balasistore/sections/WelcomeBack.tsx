/**
 * Personalized "welcome back" greeting band — shown only to a logged-in
 * (non-anonymous) customer at the top of the Balasi storefront home.
 * Mirrors the original Balasi design's return-visitor banner.
 * UI-only, theme tokens; no business logic.
 */

import { useState } from "react";
import { useUser } from "src/domains/user";
import { navigate } from "src/navigation";
import { modalApi } from "src/infra/modals";

const ORANGE = "var(--brand-secondary)"; // design --pop

const DISMISS_KEY = "balasi_welcome_dismissed";

function wasDismissed() {
	try {
		return sessionStorage.getItem(DISMISS_KEY) === "1";
	} catch {
		return false;
	}
}

export default function WelcomeBack() {
	const user = useUser();
	const [hidden, setHidden] = useState(wasDismissed);

	const isLoggedIn = !!user && !user.isAnonymous;
	if (!isLoggedIn || hidden) return null;

	const name = user.displayName || user.email?.split("@")[0] || "";

	function dismiss() {
		try {
			sessionStorage.setItem(DISMISS_KEY, "1");
		} catch {
			/* ignore */
		}
		setHidden(true);
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
				onClick={dismiss}
				aria-label="סגור"
				className="cursor-pointer border-0 bg-transparent px-[6px] text-[18px] leading-none text-white/60 hover:text-white"
			>
				×
			</button>
		</div>
	);
}
