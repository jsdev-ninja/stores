import { ReactNode } from "react";
import { Button } from "../Button/Button";

export function Submit(props: { children: ReactNode; fullWidth?: boolean }) {
	const { children, fullWidth } = props;

	return (
		<Button
			type="submit"
			fullWidth={fullWidth}
			className="border p-4 rounded h-12 bg-primary-main hover:bg-primary-dark active:bg-primary-light text-white  flex items-center justify-center"
		>
			{children}
		</Button>
	);
}
