import { useProduct } from "./useProduct";

export function ProductVolume() {
	const { product } = useProduct();
	if (!product) return null;
	return (
		<div className="text-gray-400">
			{product?.volume?.unit}
			{product.volume?.value}
		</div>
	);
}
