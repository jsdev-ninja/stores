import { TProduct } from "@jsdev_ninja/core";
import { Divider } from "@heroui/react";
import { navigate } from "src/navigation";
import { Product } from "src/widgets/Product";

function BalasiStoreProduct({ product }: { product: TProduct }) {
	const productWeightOrVolume =
		product.weight.unit !== "none" ? (
			<Product.Weight />
		) : product.volume.unit !== "none" ? (
			<Product.Volume />
		) : null;

	return (
		<Product key={product.id} product={product}>
			<div
				className="shadow p-2 w-full max-w-64 h-[320px] md:h-[520px] bg-gray-50 flex flex-col rounded-xl md:rounded-2xl relative"
				onClick={async () => {
					navigate({
						to: "store.product",
						params: { id: product.id },
						state: { product },
					});
				}}
			>
				<Product.DiscountBadge />
				<div className="absolute top-0 end-0 z-10">
					<Product.ProductAddToFavorite />
				</div>
				<div className="size-28 md:size-60 mx-auto shrink-0">
					<Product.Image prefix="productCard" />
				</div>
				<div className="flex flex-col gap-1 mt-2 md:mt-4 min-w-0">
					<Product.Name />
					<div className="flex gap-1">
						<Product.Price />
					</div>

					<div className="flex items-center gap-2">
						{productWeightOrVolume}
						<Divider orientation="vertical" />
						<Product.ProductBrand />
					</div>
				</div>
				<div className="my-2 md:my-4 text-xs md:text-sm text-gray-500 max-h-8 md:max-h-10 overflow-hidden text-ellipsis">
					<Product.Description />
				</div>
				<div className="w-full mt-auto">
					<Product.CartButton size="lg" />
				</div>
			</div>
		</Product>
	);
}

export default BalasiStoreProduct;
