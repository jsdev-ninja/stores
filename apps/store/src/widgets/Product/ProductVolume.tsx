import { useTranslation } from "react-i18next";
import { useProduct } from "./useProduct";

export function ProductVolume() {
	const { product } = useProduct();
	const { t } = useTranslation();
	if (!product || product?.volume?.unit === "none" || !product.volume?.value) return null;

	return (
		<div className="text-gray-400 flex gap-1 items-center">
			<span className="text-gray-400">{product.volume?.value}</span>
			<span className="text-gray-400">{t(`units.${product.volume?.unit}`)}</span>
		</div>
	);
}
