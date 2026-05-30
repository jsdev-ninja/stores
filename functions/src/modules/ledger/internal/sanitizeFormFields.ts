/**
 * Defense-in-depth: strip any field from the HYP formFields blob whose key
 * matches a known-secret pattern before returning it to a caller.
 *
 * The HYP APISign response should never contain these (they are request params),
 * but we apply the denylist as a forward risk guard in case HYP ever echoes them.
 *
 * An allowlist of the exact fields HYP's payment form POST needs is the ideal
 * long-term solution. TODO: pin to an allowlist once the HYP field set is confirmed
 * stable across all store configurations and promotions. Until then, the denylist
 * approach is safer than an over-aggressive allowlist that could break the HYP form.
 */
const SECRET_FIELD_DENYLIST = /^(KEY|PassP|password|pass|signKey|secret)$/i;

export function sanitizeFormFields(
	fields: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(fields).filter(([key]) => !SECRET_FIELD_DENYLIST.test(key)),
	);
}
