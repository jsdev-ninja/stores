import { ReactNode } from "react";
import { Button } from "../button";

export function Submit(props: { children: ReactNode; fullWidth?: boolean }) {
	const { children, fullWidth } = props;

	return (
		<Button type="submit" fullWidth={fullWidth}>
			{children}
		</Button>
	);
}
