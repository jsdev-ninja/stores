import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "src/lib/utils";

type Props = {
	name?: string;
	checked?: boolean;
	onChange?: ({}: { name?: string; value: boolean }) => void;
};

export function Checkbox(props: Props) {
	const { name, checked, onChange } = props;
	return (
		<RadixCheckbox.Root
			checked={checked}
			onCheckedChange={(value) => {
				onChange?.({ name, value: value as boolean });
			}}
			className="peer size-6 m-1 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
			name={name}
		>
			<RadixCheckbox.Indicator
				className={cn("flex items-center justify-center text-current", {
					"first-letter::": true,
				})}
			>
				<CheckIcon />
			</RadixCheckbox.Indicator>
		</RadixCheckbox.Root>
	);
}
