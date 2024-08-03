import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";

export const Checkbox = ({
	name,
	label,
	value,
	onChange,
}: {
	label?: string;
	value: boolean;
	name: string;
	onChange?: ({ value, name }: { value: boolean; name: string }) => void;
}) => {
	return (
		<div className="flex gap-2 items-center">
			<RadixCheckbox.Root
				checked={value}
				onCheckedChange={(newValue) =>
					onChange?.({
						value: newValue as boolean,
						name,
					})
				}
				className="shadow-blackA4 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px_black]"
				name={name}
			>
				<RadixCheckbox.Indicator className="text-violet11">
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
			{!!label && (
				<label className="pl-[15px] text-[15px] leading-none" htmlFor={name}>
					{label}
				</label>
			)}
		</div>
	);
};
