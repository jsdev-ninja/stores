// Full-screen "redirecting to payment" overlay shown during the handoff to HYP.
// Without it the browser keeps painting the stale store page (header over a blank body)
// while the POST to pay.hyp.co.il is in flight and HYP renders — looks broken.
// Self-contained inline styles so it survives the page navigation with no app CSS.
function showHypRedirectOverlay(): void {
	if (document.getElementById("hyp-redirect-overlay")) return;

	const style = document.createElement("style");
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
	title.textContent = "מעבירים אותך לתשלום מאובטח…";
	title.style.cssText = "font-size:18px;font-weight:700;color:#111827";

	const sub = document.createElement("div");
	sub.textContent = "נא להמתין, אין לסגור או לרענן את החלון";
	sub.style.cssText = "font-size:14px;color:#6b7280";

	overlay.append(spinner, title, sub);
	document.body.appendChild(overlay);
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
