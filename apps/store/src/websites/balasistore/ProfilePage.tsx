/**
 * Balasi storefront "אזור אישי" — full-page route.
 * Renders the shared AccountContent (also used by the popup AccountModal).
 */

import AccountContent from "./AccountContent";

export default function BalasiProfilePage() {
	return (
		<div className="min-h-screen bg-[var(--background)]" dir="rtl">
			<AccountContent />
		</div>
	);
}
