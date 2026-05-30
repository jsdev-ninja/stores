import { ReactNode } from "react";
import { Button } from "../button";

export function Submit(props: { children: ReactNode; fullWidth?: boolean; isPending?: boolean }) {
	const { children, fullWidth } = props;

	return (
		<Button isPending={props.isPending} type="submit" fullWidth={fullWidth}>
			{children}
		</Button>
	);
}
