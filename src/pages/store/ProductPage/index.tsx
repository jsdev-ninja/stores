import { useEffect, useState } from "react";
import { TProduct } from "src/domains";
import { ProductService } from "src/domains/product/productService";
import { useParams } from "src/navigation";
import { Product } from "src/widgets/Product";

export function ProductPage() {
	const params = useParams("store.product");

	const [product, setProduct] = useState<TProduct | null>(null);

	useEffect(() => {
		if (!params.id) return;

		ProductService.get(params.id).then((result) => {
			setProduct(result.data as TProduct);
		});
	}, [params.id]);

	if (!product) return null;

	return (
		<Product product={product}>
			<div className="container mx-4 border px-20 flex-grow flex items-center justify-center gap-20 flex-wrap">
				<div className="h-96 w-96">
					<Product.Image />
				</div>
				<div className="max-w-96">
					<Product.Name size="x4lg" />

					<div className="">
						<Product.Price />
					</div>
					<div className="my-4">
						<Product.CartButton size="md" />
					</div>
				</div>
			</div>
		</Product>
	);
}
