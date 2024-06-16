import { useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

export function ErrorMessage<T extends object>({ name }: { name: NestedKeys<T> }) {
	const form = useFormContext();

	const state = form.getFieldState(name);

	return <div className="text-error-main text-sm">{state.error?.message?.toString() ?? ""}</div>;
}
