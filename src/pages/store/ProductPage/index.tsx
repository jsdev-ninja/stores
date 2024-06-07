import { useEffect, useState } from "react";
import { Button } from "src/components/Button/Button";
import { TProduct } from "src/domains";
import { ProductApi } from "src/domains/product/product-api";
import { useParams } from "src/navigation";
import { Product } from "src/widgets/Product";

export function ProductPage() {
	const params = useParams("store.product");
	console.log("params", params);

	const [product, setProduct] = useState<TProduct | null>(null);

	useEffect(() => {
		if (!params.id) return;

		ProductApi.get(params.id).then((result) => {
			setProduct(result.data as TProduct);
		});
	}, [params.id]);

	if (!product) return null;

	return (
		<Product product={product}>
			<div className="container mx-4 border px-20 flex-grow flex items-center justify-center gap-20 flex-wrap">
				<div className="h-96 w-96">
					<img src="/banana.png" className="h-full w-full" alt="" />
				</div>
				<div className="max-w-96">
					<div className="text-gray-400 font-semibold text-lg">Sneaker Company</div>
					<Product.Name />
					<div className="text-gray-500 my-2">
						These low-profile sneakers are your perfect casual wear companion. Featuring a
						durable rubber outer sole, they’ll withstand everything the weather can offer.
					</div>
					<div className="">$125.00</div>
					<div className="my-4">
						<Button fullWidth>Add to cart</Button>
					</div>
				</div>
			</div>
		</Product>
	);
}
