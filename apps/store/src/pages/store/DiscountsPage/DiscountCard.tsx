import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { TDiscount, TProduct } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";
import { formatter } from "src/utils/formatter";

interface DiscountCardProps {
	discount: TDiscount;
}

export function DiscountCard({ discount }: DiscountCardProps) {
	const { t } = useTranslation(["common"]);
	const appApi = useAppApi();
	const [products, setProducts] = useState<TProduct[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch products data for this discount
	useEffect(() => {
		async function fetchProducts() {
			if (discount.variant.variantType !== "bundle") return;

			setIsLoading(true);
			try {
				const productPromises = discount.variant.productsId.map((productId) =>
					appApi.system.getProductById({ id: productId })
				);

				const productResults = await Promise.all(productPromises);
				const validProducts = productResults
					.filter(
						(result): result is { success: true; data: TProduct } =>
							result?.success === true && result.data !== undefined
					)
					.map((result) => result.data);

				setProducts(validProducts);
			} catch (error) {
				console.error("Error fetching discount products:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchProducts();
	}, [discount.variant.productsId]);

	// Calculate discount info based on actual product prices
	const getDiscountInfo = () => {
		if (discount.variant.variantType !== "bundle" || products.length === 0) {
			return null;
		}

		// Calculate original price based on actual product prices
		const originalPrice =
			products.reduce((total, product) => {
				return total + product.price;
			}, 0) * discount.variant.requiredQuantity;

		const savings = originalPrice - discount.variant.bundlePrice;
		const percentage = Math.round((savings / originalPrice) * 100);

		return {
			percentage,
			savings: savings.toFixed(2),
			originalPrice: originalPrice.toFixed(2),
			bundlePrice: discount.variant.bundlePrice.toFixed(2),
		};
	};

	const discountInfo = getDiscountInfo();

	if (isLoading) {
		return (
			<div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
				<div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
				<div className="h-4 bg-gray-200 rounded mb-2"></div>
				<div className="h-4 bg-gray-200 rounded w-3/4"></div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
			{/* Header with gradient background */}
			<div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white">
				{/* Status and discount badge */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
						<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
						<span className="text-sm font-medium">{t("common:active")}</span>
					</div>
					{discountInfo && (
						<div className="bg-red-500 text-white text-start text-sm font-bold px-3 py-1 rounded-full shadow-lg">
							{discountInfo.percentage}% {t("common:off")}
						</div>
					)}
				</div>

				{/* Icon and title */}
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
						<Icon icon="lucide:package" className="w-8 h-8" />
					</div>
					<h3 className="font-bold text-xl flex-1 leading-tight">{discount.name[0].value}</h3>
				</div>
			</div>

			{/* Content */}
			<div className="p-6">
				{discountInfo && (
					<div className="space-y-4 mb-6">
						{/* Price comparison */}
						<div className="flex items-center justify-between">
							<div className="flex items-baseline gap-3">
								<span className="text-3xl font-bold text-gray-900">
									{formatter.price(parseFloat(discountInfo.bundlePrice))}
								</span>
								<span className="text-lg text-gray-500 line-through">
									{formatter.price(parseFloat(discountInfo.originalPrice))}
								</span>
							</div>
							<div className="text-right">
								<div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
									{t("common:save")} {formatter.price(parseFloat(discountInfo.savings))}
								</div>
							</div>
						</div>

						{/* Bundle info */}
						<div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
							<div className="flex items-center gap-3">
								<Icon icon="lucide:package" className="w-5 h-5 text-green-600" />
								<span className="font-semibold text-green-800">
									{discount.variant.requiredQuantity} {t("common:items")} {t("common:for")}{" "}
									{formatter.price(parseFloat(discountInfo.bundlePrice))}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Products count */}
				<div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
					<Icon icon="lucide:tag" className="w-4 h-4" />
					<span>
						{discount.variant.productsId.length} {t("common:products")} {t("common:included")}
					</span>
				</div>

				{/* Action button */}
				<button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
					<Icon icon="lucide:shopping-cart" className="w-5 h-5" />
					{t("common:viewProducts")}
				</button>
			</div>
		</div>
	);
}
