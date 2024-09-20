import { i18n } from "src/infra";
import { z, ZodErrorMap, setErrorMap, ZodIssueCode } from "zod";

// Define a custom error map function
const customErrorMap: ZodErrorMap = (issue, ctx) => {
	switch (issue.code) {
		case ZodIssueCode.invalid_type:
			if (issue.expected === "string") {
				return { message: "This field must be a text." };
			} else if (issue.expected === "number") {
				return { message: "This field must be a number. " + issue.received };
			}
			break;
		case ZodIssueCode.too_small:
			if (issue.minimum === 1) return { message: i18n.t("errors:required_error") };
			return { message: `The value is too small. Minimum allowed is ${issue.minimum}.` };
		case ZodIssueCode.too_big:
			return { message: `The value is too big. Maximum allowed is ${issue.maximum}.` };
		case ZodIssueCode.invalid_enum_value:
			return { message: `Invalid value. Expected one of: ${issue.options.join(", ")}.` };
		// Add more cases here for other error codes as needed
		default:
			return { message: ctx.defaultError }; // Use the default error message
	}
	return { message: ctx.defaultError };
};

setErrorMap(customErrorMap);

export const positiveNumber = z.number().positive({
	message: i18n.t("errors:positive"),
});
export const stringSchema = z.string({
	required_error: i18n.t("errors:required_error"),
});
