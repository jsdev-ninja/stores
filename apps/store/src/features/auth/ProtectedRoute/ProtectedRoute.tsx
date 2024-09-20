import { ReactNode, useEffect, useState } from "react";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Redirect } from "src/navigation";

type Props = {
	access?: { admin: boolean };
	children: ReactNode;
};
export function ProtectedRoute(props: Props) {
	const { access, children } = props;
	const user = useAppSelector((state) => state.user.user);

	const [isValid, setIsValid] = useState(false);
	const [ready, setIsReady] = useState(false);

	useEffect(() => {
		FirebaseApi.auth.getClaims().then((claims) => {
			if (access?.admin) {
				setIsValid(!!claims?.admin);
				setIsReady(true);
			}
		});
	}, [user?.uid]);

	if (!ready) return null;

	if (!isValid) return <Redirect name="store" />;

	return children;
}
