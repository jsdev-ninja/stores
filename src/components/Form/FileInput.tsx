import { useFormContext } from "react-hook-form";

export function FileInput(props) {
	const { name } = props;

	const form = useFormContext();

	return <input multiple={false} {...form.register(name)} type="file" />;
}
