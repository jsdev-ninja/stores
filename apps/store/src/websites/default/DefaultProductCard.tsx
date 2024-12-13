import { TProduct } from "@jsdev_ninja/core";
import { Divider } from "@nextui-org/react";
import { navigate } from "src/navigation";
import { Product } from "src/widgets/Product";

function DefaultProductCard({ product }: { product: TProduct }) {
	return (
		<Product key={product.id} product={product}>
			<div
				className="shadow p-4 w-64 h-96 flex flex-col bg-gray-50 rounded-2xl relative"
				onClick={async () => {
					navigate({
						to: "store.product",
						params: { id: product.id },
						state: { product },
					});
				}}
			>
				<div className="absolute top-0 end-0">
					<Product.ProductAddToFavorite />
				</div>
				<div className="w-32 h-32 mx-auto">
					<Product.Image prefix="productCard" />
				</div>
				<div className="flex flex-col gap-1 mt-4">
					<Product.Name />
					<div className="flex gap-1">
						<Product.Price />
					</div>

					<div className="flex items-center gap-2">
						<Product.Weight />
						<Divider orientation="vertical" />
						<Product.ProductBrand />
					</div>
				</div>
				<div className="flex items-center gap-2 my-4"></div>
				<div className="w-full mt-auto">
					<Product.CartButton size="md" />
				</div>
			</div>
		</Product>
	);
}

export default DefaultProductCard;
