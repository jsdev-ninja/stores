import { get } from "lodash";
import { useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

export function ErrorMessage<T extends object>({ name }: { name: NestedKeys<T> }) {
	const form = useFormContext();

	const error = get(form.formState.errors, name);
	if (!error?.message?.toString()) return null;

	return <div className="text-sm text-start  text-red-400">{error?.message?.toString() ?? ""}</div>;
}

export function GlobalError() {
	const form = useFormContext();

	const state = form.getFieldState("global");

	return (
		<div className="text-sm text-start font-medium text-destructive text-red-400">
			{state.error?.message?.toString() ?? ""}
		</div>
	);
}
