/**
 * assertPathAllowed — path guardrail for the Firestore browser callables.
 *
 * Blocks access to any path that contains a `private` segment (case-insensitive).
 * This prevents the god-mode browser from exposing STORES/{id}/private/* or
 * COMPANIES/{id}/private/*, which hold HYP/payment credentials and other secrets.
 *
 * Rules enforced:
 *   1. No segment (when lowercased) equals "private".
 *   2. listCollections → path must be empty OR have an even segment count (doc path).
 *   3. listDocuments  → path must have an odd segment count (collection path).
 *   4. getDocument    → path must have an even segment count, non-empty (doc path).
 *
 * Returns null on success, or a string describing the violation.
 */

export type PathKind = "listCollections" | "listDocuments" | "getDocument";

function segmentsOf(path: string): string[] {
	return path.split("/").filter((s) => s.length > 0);
}

/**
 * Returns null if the path is allowed, or a short error string if blocked.
 * The caller maps the string to the appropriate SuperAdminError code.
 */
export function assertPathAllowed(
	path: string | undefined,
	kind: PathKind,
): "forbidden" | "invalid_input" | null {
	const raw = path ?? "";
	const segments = segmentsOf(raw);

	// Guardrail 1: block any `private` segment
	if (segments.some((s) => s.toLowerCase() === "private")) {
		return "forbidden";
	}

	// Guardrail 2: shape validation per operation kind
	switch (kind) {
	case "listCollections": {
		// Empty path = root (always valid). Non-empty must be a doc path: even count.
		if (raw !== "" && segments.length % 2 !== 0) {
			return "invalid_input";
		}
		break;
	}
	case "listDocuments": {
		// Must be a collection path: odd segment count, non-empty.
		if (segments.length === 0 || segments.length % 2 === 0) {
			return "invalid_input";
		}
		break;
	}
	case "getDocument": {
		// Must be a doc path: even segment count, non-empty.
		if (segments.length === 0 || segments.length % 2 !== 0) {
			return "invalid_input";
		}
		break;
	}
	}

	return null;
}
