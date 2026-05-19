import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { submitHypForm } from "src/lib/payment/submitHypForm";
import { navigate, useParams } from "src/navigation";

type Status = "loading" | "error";

export function PayRedirectPage() {
	const params = useParams("store.payRedirect");
	const appApi = useAppApi();
	const { t } = useTranslation(["payRedirectPage"]);
	const [status, setStatus] = useState<Status>("loading");

	useEffect(() => {
		if (!params.token) {
			setStatus("error");
			return;
		}
		appApi.user.getPaymentRedirect({ token: params.token }).then((res: any) => {
			if (res?.success && res.data?.success && res.data.formAction && res.data.formFields) {
				submitHypForm(res.data.formAction, res.data.formFields);
			} else {
				setStatus("error");
			}
		});
	}, [params.token]);

	if (status === "loading") {
		return (
			<div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50">
				<div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 text-center" dir="rtl">
					<div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-9 h-9 text-blue-600 animate-spin"
							aria-hidden="true"
						>
							<path d="M21 12a9 9 0 1 1-6.219-8.56" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						{t("payRedirectPage:loadingTitle")}
					</h1>
					<p className="text-gray-700 leading-relaxed">
						{t("payRedirectPage:loadingDescription")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50">
			<div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 text-center" dir="rtl">
				<div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="w-9 h-9 text-red-600"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{t("payRedirectPage:errorTitle")}
				</h1>
				<p className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
					{t("payRedirectPage:errorDescription")}
				</p>
				<div className="flex justify-center">
					<div className="w-48">
						<Button onPress={() => navigate({ to: "store" })} fullWidth>
							{t("payRedirectPage:actionButton")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
