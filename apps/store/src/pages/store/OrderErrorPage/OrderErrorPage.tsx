import { TOrder } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";

function getQueryParams(url: string): Record<string, string> {
	const queryParams: Record<string, string> = {};
	const urlObj = new URL(url);
	const params = new URLSearchParams(urlObj.search);

	params.forEach((value, key) => {
		queryParams[key] = value;
	});

	return queryParams;
}

export function OrderErrorPage() {
	const { t } = useTranslation(["orderErrorPage"]);

	const appApi = useAppApi();

	const [order, setOrder] = useState<TOrder | null>(null);

	const queryParams = getQueryParams(window.location.href);

	useEffect(() => {
		async function load() {
			await appApi.system.onPaymentFailed(queryParams);

			if (queryParams.Order) {
				appApi.user.getOrder({ id: queryParams.Order }).then((res) => {
					if (res.success) {
						setOrder(res.data);
					}
					// On failure, stay on error page — no redirect
				});
			}
		}
		load();
	}, [queryParams.Order, window.location.href]);

	return (
		<div className="h-screen w-screen flex items-center justify-center p-4">
			<div className="max-w-screen-sm mx-auto p-4 shadow">
				<div className="mx-auto text-center text-red-500 text-3xl my-4">
					{t("orderErrorPage:title")}
				</div>
				<div className="my-4 text-gray-600 text-xl">{t("orderErrorPage:description")}</div>

				{order && (
					<div className="my-4 flex flex-col gap-4">
						<div className="flex justify-between items-center">
							<span className="font-bold text-lg">{t("orderErrorPage:orderId")}</span>
							<span className="font-bold text-lg">{order.id}</span>
						</div>
					</div>
				)}

				<div className="flex justify-center my-8">
					<div className="w-40">
						<Button
							onPress={() =>
								navigate({
									to: "store",
								})
							}
							fullWidth
						>
							{t("orderErrorPage:actionButton")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
