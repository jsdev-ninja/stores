import { TProduct } from "@jsdev_ninja/core";
import { Divider } from "@heroui/react";
import { navigate } from "src/navigation";
import { Product } from "src/widgets/Product";

function DefaultProductCard({ product }: { product: TProduct }) {
	return (
		<Product key={product.id} product={product}>
			<div
				className="shadow p-2 md:p-4 w-full max-w-64 h-auto min-h-[280px] md:h-96 flex flex-col bg-gray-50 rounded-xl md:rounded-2xl relative"
				onClick={async () => {
					navigate({
						to: "store.product",
						params: { id: product.id },
						state: { product },
					});
				}}
			>
				<Product.DiscountBadge />
				<div className="absolute top-0 end-0">
					<Product.ProductAddToFavorite />
				</div>
				<div className="w-20 h-20 md:w-32 md:h-32 mx-auto shrink-0">
					<Product.Image prefix="productCard" />
				</div>
				<div className="flex flex-col gap-1 mt-2 md:mt-4 min-w-0">
					<Product.Name />
					<div className="flex gap-2 items-center">
						<Product.Price /> <Product.OriginalPrice /> <Product.PriceType />
					</div>

					<div className="flex items-center gap-2">
						<Product.Weight />
						<Divider orientation="vertical" />
						<Product.ProductBrand />
					</div>
				</div>

				<div className="w-full mt-auto">
					<Product.CartButton size="md" />
				</div>
			</div>
		</Product>
	);
}

export default DefaultProductCard;
