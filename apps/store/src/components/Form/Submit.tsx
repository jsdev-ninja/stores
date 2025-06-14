import { ReactNode } from "react";
import { Button } from "../button";

export function Submit(props: { children: ReactNode; fullWidth?: boolean; isLoading?: boolean }) {
	const { children, fullWidth } = props;

	return (
		<Button isLoading={props.isLoading} type="submit" fullWidth={fullWidth}>
			{children}
		</Button>
	);
}
