import { Button as UiButton, Spinner } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";
import { forwardRef } from "react";

export interface IButtonProps extends ButtonProps {}

export const Button = forwardRef<HTMLButtonElement | null, IButtonProps>(function Button(
	{ children, ...rest },
	ref,
) {
	return (
		<UiButton {...rest} ref={ref}>
			{(state) => (
				<>
					{state.isPending && <Spinner color="current" size="sm" />}
					{typeof children === "function" ? children(state) : children}
				</>
			)}
		</UiButton>
	);
});
Button.displayName = "Button";
