import { Button as UiButton, ButtonProps } from "@nextui-org/button";

export interface IButtonProps extends ButtonProps {}

export function Button(props: IButtonProps) {
	return <UiButton {...props} />;
}
Button.displayName = "Button";
