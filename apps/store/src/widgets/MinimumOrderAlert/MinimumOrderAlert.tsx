import { Alert, Progress } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useStore } from "src/domains/Store";
import { useCart } from "src/domains/cart";
import { getCartCost } from "@jsdev_ninja/core";
import { useDiscounts } from "src/domains/Discounts/Discounts";

// todo
// handle store minimum amout
// handle store delivery price if amoutn reachde

export const MinimumOrderAlert = () => {
	const { t } = useTranslation(["minimumOrderAlert", "deliveryDiscount"]);

	const cart = useCart();
	const store = useStore();
	const discounts = useDiscounts();

	if (!store) return null;

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	const deliveryPrice = store?.deliveryPrice ?? 0;
	const freeDeliveryPrice = store?.freeDeliveryPrice ?? 0;
	if (!deliveryPrice || !freeDeliveryPrice) {
		return null;
	}

	const isFreeDelivery = cartCost.productsCost >= freeDeliveryPrice;
	const amountNeeded = freeDeliveryPrice - cartCost.productsCost;
	const progressPercentage = Math.min(100, (cartCost.productsCost / freeDeliveryPrice) * 100);

	// If delivery is free, show success message
	if (isFreeDelivery) {
		return (
			<div className="w-full mb-4">
			<Alert
				color="success"
				variant="flat"
				className="py-4"
			>
					<div className="space-y-1 pl-1">
						<p className="font-medium text-base">
							{t("deliveryDiscount:freeDeliveryTitle", { defaultValue: "משלוח חינם!" })}
						</p>
						<p className="text-sm">
							{t("deliveryDiscount:freeDeliveryDescription", {
								defaultValue: "הזמנתך עולה על ₪{{amount}} - משלוח חינם!",
								amount: freeDeliveryPrice,
							})}
						</p>
					</div>
				</Alert>
			</div>
		);
	}

	// If delivery is not free, show warning with delivery price
	return (
		<div className="w-full mb-4">
			<Alert
				color="warning"
				variant="flat"
				className="py-4"
			>
				<div className="space-y-1 pl-1">
					<p className="font-medium text-base">
						{t("deliveryDiscount:title", { amount: freeDeliveryPrice })}
					</p>
					<p className="text-sm">
						{t("deliveryDiscount:description", { amount: amountNeeded })}
					</p>
					<p className="text-sm font-medium mt-2">
						{t("deliveryDiscount:deliveryPriceInfo", {
							defaultValue: "מחיר משלוח: ₪{{price}}",
							price: deliveryPrice,
						})}
					</p>
				</div>
			</Alert>

			<div className="mt-4 px-1">
				<Progress
					aria-label="Order progress"
					value={progressPercentage}
					color="warning"
					className="max-w-full"
					size="md"
					showValueLabel={true}
					formatOptions={{ style: "percent", signDisplay: "never" }}
				/>
			</div>
		</div>
	);
};
