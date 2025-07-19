import { useProduct } from "./useProduct";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { getDiscountBadgeText, getDiscountDisplayText } from "src/utils/discountUtils";
import { useTranslation } from "react-i18next";

interface ProductDiscountBadgeProps {
	className?: string;
}

export function ProductDiscountBadge({ className = "" }: ProductDiscountBadgeProps) {
	const { product } = useProduct();
	const discounts = useDiscounts();
	const { t } = useTranslation(["common"]);

	if (!product) return null;

	const badgeText = getDiscountBadgeText(product, discounts);
	const displayText = getDiscountDisplayText(product, discounts);

	if (!badgeText) return null;

	return (
		<div className={`absolute top-2 right-2 z-10 ${className}`}>
			{/* Percentage badge */}
			<div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
				{badgeText}
			</div>

			{/* Display text - positioned below to avoid favorite button */}
			{displayText && (
				<div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-lg shadow-lg mt-1 max-w-28 text-right">
					{displayText.split(" ")[0]} {t("common:for")} {displayText.split(" ")[1]}
				</div>
			)}
		</div>
	);
}
