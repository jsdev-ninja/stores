import { useTranslation } from "react-i18next";
import { useProduct } from "./useProduct";

export function ProductPriceType() {
	const { product } = useProduct();

	const { t } = useTranslation(["common"]);

	if (!product) return null;

	if (product.priceType.type === "unit") return null;

	return (
		<div className="text-gray-400">
			{t(`units.${product.priceType.type}`)} {product.priceType.value}
		</div>
	);
}
