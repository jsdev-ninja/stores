import { useProduct } from "./useProduct";

export function ProductDiscount() {
	const { product } = useProduct();
	if (!product) return null;
	return (
		<div className="text-gray-400">
			{product?.discount?.type}
			{product.discount?.value}
		</div>
	);
}
