import { TFavoriteProduct, TProduct } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { useFavoriteProducts } from "src/domains/favoriteProducts";
import { Product } from "src/widgets/Product";

function FavoritesProductsPage() {
	const favoritesProducts = useFavoriteProducts();

	return (
		<div className="p-4">
			<div className="divide-y">
				{favoritesProducts.map((product) => (
					<FavoritesProduct favoriteProduct={product} key={product.id} />
				))}
			</div>
		</div>
	);
}

function FavoritesProduct({ favoriteProduct }: { favoriteProduct: TFavoriteProduct }) {
	const [product, setProduct] = useState<TProduct | null>(null);

	const appApi = useAppApi();

	const { t } = useTranslation(["favorites"]);

	useEffect(() => {
		appApi.system.getProductById({ id: favoriteProduct.productId }).then((res) => {
			if (res?.success) {
				setProduct(res.data);
			}
		});
	}, []);

	if (!product) return null;

	return (
		<Product product={product}>
			<div className="flex items-center gap-4">
				<div className="size-20">
					<Product.Image />
				</div>
				<div className="">
					<Product.Name />
					<Product.Price />
				</div>

				<div className="flex gap-2 ms-auto">
					<div className="">
						<Product.CartButton size="md" />
					</div>
					<Button color="secondary">{t("viewProduct")}</Button>
					<Button
						onClick={() => appApi.user.removeProductToFavorite({ id: favoriteProduct.id })}
						variant="bordered"
						color="danger"
					>
						{t("favorites:remove")}
					</Button>
				</div>
			</div>
		</Product>
	);
}

export default FavoritesProductsPage;
