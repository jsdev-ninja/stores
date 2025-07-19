import { Icon } from "@iconify/react";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useTranslation } from "react-i18next";
import { DiscountCard } from "./DiscountCard";
import { DiscountEngine } from "@jsdev_ninja/core";

export default function DiscountsPage() {
	const discounts = useDiscounts();
	const { t } = useTranslation(["common"]);

	// Filter only active discounts
	const activeDiscounts = DiscountEngine.getActiveDiscounts(discounts);

	if (activeDiscounts.length === 0) {
		return (
			<section className="py-12 px-4 max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-bold text-default-900">{t("common:discounts")}</h2>
				</div>

				<div className="text-center py-16">
					<Icon icon="lucide:tag" className="w-16 h-16 text-default-300 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-default-600 mb-2">
						{t("common:noDiscountsAvailable")}
					</h3>
					<p className="text-default-500">{t("common:checkBackLater")}</p>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 px-4 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h2 className="text-3xl font-bold text-default-900 mb-2">{t("common:discounts")}</h2>
					<p className="text-default-600">
						{activeDiscounts.length} {t("common:active")} {t("common:discounts")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{activeDiscounts.map((discount) => (
					<DiscountCard key={discount.id} discount={discount} />
				))}
			</div>
		</section>
	);
}
