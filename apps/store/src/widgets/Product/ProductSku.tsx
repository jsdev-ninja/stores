import { useProduct } from "./useProduct";

export function ProductSku() {
	const { product } = useProduct();
	return <div className="text-gray-400">{product?.sku ?? ""}</div>;
}
