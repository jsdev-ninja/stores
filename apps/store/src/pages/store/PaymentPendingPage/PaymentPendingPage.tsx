import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";

export function PaymentPendingPage() {
	const { t } = useTranslation(["paymentPendingPage"]);

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50">
			<div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 text-center" dir="rtl">
				<div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="w-9 h-9 text-amber-600"
						aria-hidden="true"
					>
						<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{t("paymentPendingPage:title")}
				</h1>
				<p className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
					{t("paymentPendingPage:description")}
				</p>

				<div className="flex justify-center">
					<div className="w-48">
						<Button onPress={() => navigate({ to: "store" })} fullWidth>
							{t("paymentPendingPage:actionButton")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
