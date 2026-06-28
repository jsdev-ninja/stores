/**
 * Remembered login email — lightweight, client-only.
 *
 * Saves the email a customer last logged in with, in localStorage, so the login
 * form can pre-fill it on a return visit and the customer only types a password.
 * Only the email is ever stored — never the password. Purely additive: reading
 * or writing never throws (localStorage may be unavailable / full), and a
 * missing/blank value just resolves to "".
 */

const STORAGE_KEY = "rememberedEmail";

export function rememberEmail(email: string): void {
	if (!email) return;
	try {
		localStorage.setItem(STORAGE_KEY, email);
	} catch {
		// localStorage unavailable / quota exceeded — remembering is best-effort.
	}
}

export function getRememberedEmail(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

export function clearRememberedEmail(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// best-effort
	}
}
