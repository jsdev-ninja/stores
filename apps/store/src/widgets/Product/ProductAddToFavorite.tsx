import { useProduct } from "./useProduct";
import { Button } from "src/components/button";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";

export function ProductAddToFavorite() {
	const { product } = useProduct();

	const appApi = useAppApi();

	function handlePress() {
		if (!product) return;
		appApi.user.addProductToFavorite({ product });
	}

	if (!product) return null;

	return (
		<Button onPress={handlePress} variant="light" color="danger" isIconOnly>
			<Icon name="heart" />
		</Button>
	);
}
