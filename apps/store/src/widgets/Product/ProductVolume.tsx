import { useProduct } from "./useProduct";

export function ProductVolume() {
	const { product } = useProduct();
	if (!product || product?.volume?.unit === "none" || !product.weight?.value) return null;

	return (
		<div className="text-gray-400">
			{product?.volume?.unit}
			{product.volume?.value}
		</div>
	);
}
