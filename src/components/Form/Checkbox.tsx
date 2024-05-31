import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { useController } from "react-hook-form";

export const Checkbox = ({ name, label }: { name: string; label?: string }) => {
	const form = useController({ name });
	return (
		<div className="flex gap-2 items-center">
			<label className="pl-[15px] text-[15px] leading-none" htmlFor={name}>
				{label}
			</label>
			<RadixCheckbox.Root
				onCheckedChange={form.field.onChange}
				className="shadow-blackA4 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px_black]"
				id={name}
			>
				<RadixCheckbox.Indicator className="text-violet11">
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
		</div>
	);
};
