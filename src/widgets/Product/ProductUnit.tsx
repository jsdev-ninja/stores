import { useProduct } from "./useProduct";

export function ProductUnit() {
	const { product } = useProduct();
	if (!product) return null;

	return (
		<div className="text-gray-400">
			{product.unit.type} {product.unit.value}
		</div>
	);
}
