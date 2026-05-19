import { useEffect, useRef, useState } from "react";
import { FirebaseApi } from "src/lib/firebase";
import { submitHypForm } from "src/lib/payment/submitHypForm";
import { useParams } from "src/navigation";

type Status = "loading" | "error_expired" | "error_not_found" | "error_generic";

export function usePayRedirectPage() {
	const { token } = useParams("pay");
	const [status, setStatus] = useState<Status>("loading");
	const calledRef = useRef(false);

	useEffect(() => {
		if (!token) {
			setStatus("error_not_found");
			return;
		}
		// Guard against React StrictMode double-invoke
		if (calledRef.current) return;
		calledRef.current = true;

		FirebaseApi.api.getPaymentRedirect({ token }).then((res) => {
			if (!res.success || !res.data?.success) {
				const error = res.data?.error ?? "";
				if (error === "expired") {
					setStatus("error_expired");
				} else if (error === "not_found") {
					setStatus("error_not_found");
				} else {
					setStatus("error_generic");
				}
				return;
			}
			const { formAction, formFields } = res.data;
			if (formAction && formFields) {
				submitHypForm(formAction, formFields);
			} else {
				setStatus("error_generic");
			}
		});
	}, [token]);

	return { status };
}
