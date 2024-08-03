import { useProduct } from "./useProduct";

export function ProductPriceType() {
	const { product } = useProduct();
	if (!product) return null;

	return (
		<div className="text-gray-400">
			{product.priceType.type} {product.priceType.value}
		</div>
	);
}
