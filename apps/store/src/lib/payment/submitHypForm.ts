// Full-screen "redirecting to payment" overlay shown during the handoff to HYP.
// Without it the browser keeps painting the stale store page (header over a blank body)
// while the POST to pay.hyp.co.il is in flight and HYP renders — looks broken.
// Self-contained inline styles so it survives the page navigation with no app CSS.
// Exported so the checkout page can paint it the moment a card payment is
// submitted — covering the order-create + payment-link-generation wait — instead
// of only at the final HYP handoff. Idempotent: safe to call again from submitHypForm.
export function showHypRedirectOverlay(): void {
	if (document.getElementById("hyp-redirect-overlay")) return;

	const style = document.createElement("style");
	style.id = "hyp-redirect-overlay-style";
	style.textContent = "@keyframes hypspin{to{transform:rotate(360deg)}}";
	document.head.appendChild(style);

	const overlay = document.createElement("div");
	overlay.id = "hyp-redirect-overlay";
	overlay.setAttribute("dir", "rtl");
	overlay.style.cssText = [
		"position:fixed",
		"inset:0",
		"z-index:2147483647",
		"display:flex",
		"flex-direction:column",
		"align-items:center",
		"justify-content:center",
		"gap:20px",
		"background:#ffffff",
		"font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif",
	].join(";");

	const spinner = document.createElement("div");
	spinner.style.cssText = [
		"width:48px",
		"height:48px",
		"border-radius:50%",
		"border:4px solid #e5e7eb",
		"border-top-color:#16a34a",
		"animation:hypspin .8s linear infinite",
	].join(";");

	const title = document.createElement("div");
	title.textContent = "מעבירים אותך לעמוד התשלום המאובטח…";
	title.style.cssText = "font-size:18px;font-weight:700;color:#111827";

	// Highlighted reassurance: the order is ALREADY saved server-side at this point.
	// If the payment step hiccups the customer must know their order wasn't lost —
	// only the payment still has to be completed.
	const badge = document.createElement("div");
	badge.setAttribute("dir", "rtl");
	badge.style.cssText = [
		"display:flex",
		"flex-direction:column",
		"align-items:center",
		"gap:4px",
		"max-width:340px",
		"padding:12px 20px",
		"border-radius:12px",
		"background:#f0fdf4",
		"border:1px solid #bbf7d0",
		"text-align:center",
	].join(";");

	const badgeTitle = document.createElement("div");
	badgeTitle.textContent = "✓ ההזמנה שלך נוצרה ונשמרה";
	badgeTitle.style.cssText = "font-size:15px;font-weight:700;color:#15803d";

	const badgeSub = document.createElement("div");
	badgeSub.textContent = "התשלום עדיין לא הושלם — יש להשלים אותו בעמוד הבא";
	badgeSub.style.cssText = "font-size:13px;color:#166534";

	badge.append(badgeTitle, badgeSub);

	const sub = document.createElement("div");
	sub.textContent = "נא להמתין, אין לסגור או לרענן את החלון";
	sub.style.cssText = "font-size:14px;color:#6b7280";

	overlay.append(spinner, title, badge, sub);
	document.body.appendChild(overlay);
}

// Removes the overlay when we did NOT hand off to a full-page navigation (payment
// link failed, or an error was thrown). The overlay lives on document.body, outside
// React, so it would otherwise stay stuck over the next client-side route.
export function hideHypRedirectOverlay(): void {
	document.getElementById("hyp-redirect-overlay")?.remove();
	document.getElementById("hyp-redirect-overlay-style")?.remove();
}

// POST avoids 414 Request-URI Too Large on large carts — HYP accepts application/x-www-form-urlencoded
export function submitHypForm(action: string, fields: Record<string, string>): void {
	const form = document.createElement("form");
	form.method = "POST";
	form.action = action;
	form.acceptCharset = "UTF-8";
	form.style.display = "none";
	for (const [name, value] of Object.entries(fields)) {
		const input = document.createElement("input");
		input.type = "hidden";
		input.name = name;
		input.value = value;
		form.appendChild(input);
	}
	document.body.appendChild(form);
	// Paint the loading overlay BEFORE navigating away, so the customer never sees the
	// stale/blank page during the HYP handoff.
	showHypRedirectOverlay();
	form.submit();
}
