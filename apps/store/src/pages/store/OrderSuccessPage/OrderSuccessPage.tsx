import { TOrder } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Price } from "src/components/Price";
import { OrderApi } from "src/domains/Order";
import { useAppSelector } from "src/infra";
import { navigate, useParams } from "src/navigation";
import { calculateCartPrice } from "src/utils/calculateCartPrice";

function getQueryParams(url: string): Record<string, string> {
	const queryParams: Record<string, string> = {};
	const urlObj = new URL(url);
	const params = new URLSearchParams(urlObj.search);

	params.forEach((value, key) => {
		queryParams[key] = value;
	});

	return queryParams;
}

export function OrderSuccessPage() {
	const { t } = useTranslation(["orderSuccessPage"]);

	const appApi = useAppApi();

	const [order, setOrder] = useState<TOrder | null>(null);

	const user = useAppSelector((state) => state.user.user);

	const queryParams = getQueryParams(window.location.href);
	console.log("queryParams", queryParams);
	useEffect(() => {
		appApi.system.createPayment(queryParams);
	}, [window.location.href]);

	useEffect(() => {
		OrderApi.getOrder(queryParams.Order).then((res) => {
			if (res.success) {
				setOrder(res.data);
			} else {
				navigate({
					to: "store",
				});
			}
		});
	}, [queryParams.Order]);

	const orderCost = calculateCartPrice(order?.cart.items ?? []);

	return (
		<div className="h-screen w-screen flex items-center justify-center p-4">
			<div className="max-w-screen-sm mx-auto p-4 shadow">
				<div className="mx-auto text-center text-green-500 text-4xl my-4">
					{t("orderSuccessPage:title")}
				</div>
				<div className="my-4 text-gray-600 text-xl">{t("orderSuccessPage:description")}</div>

				<div className="my-4 flex flex-col gap-4">
					<div className="flex justify-between items-center">
						<span className="font-bold text-lg">{t("orderSuccessPage:orderId")}</span>
						<span className="font-bold text-lg">{order?.id}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="font-bold text-lg">{t("orderSuccessPage:orderCost")}</span>
						<span className="font-bold text-lg">
							<Price price={orderCost.finalCost} />
						</span>
					</div>
				</div>
				<div className="flex justify-center my-8">
					<div className="w-40">
						<Button
							onClick={() =>
								navigate({
									to: "store",
								})
							}
							fullWidth
						>
							{t("orderSuccessPage:actionButton")}
						</Button>
					</div>
				</div>
				{user?.isAnonymous && (
					<div className="">
						<div className="">{t("orderSuccessPage:anonymousMessage")}</div>
					</div>
				)}
			</div>
		</div>
	);
}
