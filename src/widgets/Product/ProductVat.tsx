import { useProduct } from "./useProduct";

export function ProductVat() {
	const { product } = useProduct();
	return <div className="text-gray-400">{product?.vat ? "has vat" : "no vat"}</div>;
}
