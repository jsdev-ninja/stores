import { getCartCost } from "@jsdev_ninja/core";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Price } from "src/components/Price";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
// import { useDiscounts } from "src/domains/Discounts/Discounts";

export function PaymentSummary({ children }: { children?: ReactNode }) {
	const { t } = useTranslation(["common", "paymentSummary"]);

	const cart = useCart();
	// const discounts = useDiscounts();

	const discounts = useDiscounts();
	const store = useStore();

	if (!cart || !store) {
		return null;
	}

	const cartCost = getCartCost({
		cart: cart.items,
		discounts: discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});
	console.log("cartCost", cartCost);

	return (
		<div
			style={{
				viewTransitionName: "PaymentSummary",
			}}
			className="mx-auto mt-6 w-96 space-y-6 lg:mt-0"
		>
			<div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
				<p className="text-xl font-semibold text-gray-900 dark:text-white">
					{t("paymentSummary:title")}
				</p>
				<div className="space-y-4">
					<div className="space-y-2">
						<LineItem label={t("products")} value={cartCost.cost} />
						<LineItem label={t("discount")} value={cartCost.discount} />
						<LineItem label={t("deliveryPrice")} value={cartCost.deliveryPrice ?? 0} />
						<LineItem label={t("vat")} value={cartCost.vat} />
					</div>
					<dl className="border-t border-gray-200 pt-2 dark:border-gray-700">
						<LineItem label={t("paymentSummary:totalCost")} value={cartCost.finalCost} bold />
					</dl>
				</div>
				{children}
			</div>
		</div>
	);
}

function LineItem({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
	if (bold) {
		return (
			<dl className="flex items-center justify-between gap-4">
				<dt className="text-base font-bold text-gray-900 dark:text-gray-400">{label}</dt>
				<dd className="text-base font-bold text-gray-900 dark:text-white">
					<Price price={value} />
				</dd>
			</dl>
		);
	}
	return (
		<dl className="flex items-center justify-between gap-4">
			<dt className="text-base font-normal text-gray-500 dark:text-gray-400">{label}</dt>
			<dd className="text-base font-medium text-gray-900 dark:text-white">
				<Price price={value} />
			</dd>
		</dl>
	);
}
