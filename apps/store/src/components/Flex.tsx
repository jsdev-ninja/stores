import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "src/lib/utils";

const flexVariants = cva("flex w-full", {
	variants: {
		align: {
			center: "items-center",
			start: "items-start",
			end: "items-end",
		},
		justify: {
			center: "justify-center",
			start: "justify-start",
			end: "justify-end",
			between: "justify-between",
		},
		wrap: {
			true: "flex-wrap",
		},
		gap: {
			none: "gap-0",
			"1": "gap-1",
			"2": "gap-2",
			"3": "gap-3",
			"4": "gap-4",
			"5": "gap-5",
		},
	},
	defaultVariants: {
		align: "center",
		justify: "start",
		gap: "none",
	},
});

export interface Props
	extends React.ButtonHTMLAttributes<HTMLDivElement>,
		VariantProps<typeof flexVariants> {
	asChild?: boolean;
}

const Flex = React.forwardRef<HTMLDivElement, Props>(
	({ className, justify, align, gap, wrap, asChild = false, onClick, ...props }, ref) => {
		const Comp = asChild ? Slot : "div";
		return (
			<Comp
				className={cn(flexVariants({ justify, align, gap, wrap, className }))}
				ref={ref}
				onClick={(event) => {
					event.stopPropagation();
					onClick?.(event);
				}}
				{...props}
			/>
		);
	}
);
Flex.displayName = "Flex";

// Correct the type definition to include the custom Item property
type FlexComponent = React.ForwardRefExoticComponent<
	Props & React.RefAttributes<HTMLDivElement>
> & {
	Item: typeof Item;
};

// Export the Flex component with the correct type
const FlexWithItem = Flex as FlexComponent;

// Define the Item component for Flex
const Item: React.FC<{ className?: string; grow?: "1" | "none"; children: React.ReactNode }> = ({
	children,
	className = "",
	grow = "1",
}) => {
	return (
		<div
			className={`${cn({
				grow: grow === "1",
			})} ${className}`}
		>
			{children}
		</div>
	);
};
FlexWithItem.Item = Item;

export { FlexWithItem as Flex, flexVariants };
