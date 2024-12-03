import { Button as UiButton, ButtonProps } from "@nextui-org/button";
import { forwardRef } from "react";

export interface IButtonProps extends ButtonProps {}

export const Button = forwardRef<HTMLButtonElement | null, IButtonProps>(function Button(
	props,
	ref
) {
	return <UiButton {...props} ref={ref} />;
});
Button.displayName = "Button";
