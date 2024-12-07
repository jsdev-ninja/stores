import { TFavoriteProduct } from "@jsdev_ninja/core";
import { useFavoriteProducts } from "src/domains/favoriteProducts";

function FavoritesProductsPage() {
	const favoritesProducts = useFavoriteProducts();

	return (
		<div className="">
			<div className="">
				{favoritesProducts.map((product) => (
					<FavoritesProduct favoriteProduct={product} key={product.id} />
				))}
			</div>
		</div>
	);
}

function FavoritesProduct({ favoriteProduct }: { favoriteProduct: TFavoriteProduct }) {
	return <div className="">{favoriteProduct.id}</div>;
}

export default FavoritesProductsPage;
