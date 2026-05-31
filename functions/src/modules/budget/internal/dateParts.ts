/**
 * Compute year/month/yearMonth date parts in Asia/Jerusalem timezone.
 *
 * Cloud Functions run on UTC servers. Using new Date().getMonth() would give
 * the wrong month-bucket for events near midnight in Israel / around DST.
 * We use Intl.DateTimeFormat with timeZone: "Asia/Jerusalem" to get correct
 * local date parts regardless of server timezone.
 */

const TZ = "Asia/Jerusalem";

export type DateParts = {
	year: number;
	month: number; // 1-12
	yearMonth: string; // "2026-05"
};

export function getJerusalemDateParts(epochMillis: number): DateParts {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const parts = formatter.formatToParts(new Date(epochMillis));
	const yearPart = parts.find((p) => p.type === "year");
	const monthPart = parts.find((p) => p.type === "month");
	// Intl.DateTimeFormat always produces year + month parts — safe to assert
	if (!yearPart || !monthPart) {
		throw new Error("dateParts: Intl.DateTimeFormat did not return expected year/month parts");
	}
	const year = parseInt(yearPart.value, 10);
	const month = parseInt(monthPart.value, 10);
	const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

	return { year, month, yearMonth };
}
