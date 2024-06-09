import { useProduct } from "./useProduct";

export function ProductWeight() {
	const { product } = useProduct();
	if (!product) return null;
	return (
		<div className="text-gray-400">
			{product?.weight?.unit}
			{product.weight?.value}
		</div>
	);
}
