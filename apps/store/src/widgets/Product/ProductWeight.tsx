import { useTranslation } from "react-i18next";
import { useProduct } from "./useProduct";
import { LOCALES_MAP } from "src/config";
import { TProduct } from "@jsdev_ninja/core";

export function ProductWeight() {
	const { product } = useProduct();

	const { i18n } = useTranslation();

	if (!product || product?.weight?.unit === "none" || !product.weight?.value) return null;

	return <div className="text-gray-400 shrink-0">{formatWeightKg(i18n.language, product.weight)}</div>;
}

function formatWeightKg(lang: string, weight: TProduct["weight"]) {
	return new Intl.NumberFormat(LOCALES_MAP[lang as keyof typeof LOCALES_MAP], {
		style: "unit",
		unit: weight.unit === "kg" ? "kilogram" : "gram",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(weight.value);
}
