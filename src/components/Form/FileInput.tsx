import { useController } from "react-hook-form";
import { NestedKeys } from "src/shared/types";

export function FileInput<T>(props: { name: NestedKeys<T>; label?: string }) {
	const { name } = props;

	const control = useController({ name });

	// const form = useFormContext();

	return (
		<input
			multiple={false}
			type="file"
			onChange={(event) => {
				const file = event.target.files?.[0];
				control.field.onChange(file);
			}}
		/>
	);
}
