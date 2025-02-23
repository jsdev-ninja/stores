import { useProduct } from "./useProduct";
import { Button } from "src/components/button";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { useFavoriteProducts } from "src/domains/favoriteProducts";

export function ProductAddToFavorite() {
	const { product } = useProduct();

	const appApi = useAppApi();

	const favoriteProducts = useFavoriteProducts();

	const inFavorites = favoriteProducts.find((p) => p.productId === product?.id);

	function handlePress() {
		if (!product) return;
		if (!inFavorites) {
			return appApi.user.addProductToFavorite({ product });
		}
		return appApi.user.removeProductToFavorite({ id: inFavorites.id });
	}

	if (!product) return null;

	return (
		<Button onPress={handlePress} variant="light" color="danger" isIconOnly>
			<Icon fill={!!inFavorites} name="heart" />
		</Button>
	);
}
