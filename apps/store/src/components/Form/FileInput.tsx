import { useController, useFormContext } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

export function FileInput<T>(props: { name: NestedKeys<T>; label?: string }) {
	const { name } = props;

	const form = useFormContext();
	const control = useController({ name, control: form.control });

	return (
		<input
			multiple={false}
			accept="image/*"
			type="file"
			onChange={(event) => {
				const file = event.target.files?.[0];
				control.field.onChange(file);
			}}
		/>
	);
}
