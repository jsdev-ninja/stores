import { useEffect } from "react";
import { navigate } from "src/navigation";

export default function DefaultHomePage() {
	useEffect(() => {
		navigate({ to: "store.catalog" });
	}, []);

	return null;
}
