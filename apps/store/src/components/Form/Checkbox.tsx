import { useController } from "react-hook-form";
import { NestedKeys } from "src/shared/types";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "src/lib/utils";

export const Checkbox = <T,>({ name, label }: { name: NestedKeys<T>; label?: string }) => {
	const form = useController({ name });

	return (
		<div className="flex flex-col gap-2 items-center">
			{!!label && (
				<label
					className="block text-sm font-medium text-gray-900 dark:text-white"
					htmlFor={name}
				>
					{label}
				</label>
			)}
			<RadixCheckbox.Root
				checked={form.field.value}
				onCheckedChange={form.field.onChange}
				className="peer size-6 m-1 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
				name={name}
			>
				<RadixCheckbox.Indicator
					className={cn("flex items-center justify-center text-current")}
				>
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
		</div>
	);
};
