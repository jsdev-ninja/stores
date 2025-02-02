import { ReactNode, useEffect, useState } from "react";
import { useAppSelector } from "src/infra";
import { Redirect } from "src/navigation";

type Props = {
	access?: { admin?: boolean; superAdmin?: boolean };
	children: ReactNode;
};
export function ProtectedRoute(props: Props) {
	const { access, children } = props;
	const user = useAppSelector((state) => state.user.user);

	const [isValid, setIsValid] = useState(false);
	const [ready, setIsReady] = useState(false);

	useEffect(() => {
		if (access?.admin) {
			setIsValid(!!user?.admin);
			setIsReady(true);
		} else if (access?.superAdmin) {
			setIsValid(!!user?.superAdmin);
			setIsReady(true);
		}
	}, [user?.uid]);

	if (!ready) return null;

	if (!isValid) return <Redirect name="store" />;

	return children;
}
