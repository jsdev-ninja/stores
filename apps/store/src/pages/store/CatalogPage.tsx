import { getCartCost } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { formatter } from "src/utils/formatter";
import { Cart } from "src/widgets/Cart/Cart";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { ProductsWidget } from "src/widgets/Products";

// todo why render twice when setSTATE
export function CatalogPage() {
	const { t } = useTranslation(["common"]);

	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();

	if (!store) return null;

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	return (
		<div className="flex w-full h-full">
			<div className="hidden md:block shrink-0 max-w-80 grow  overflow-auto p-4 sticky top-0 h-[calc(100vh-64px)]">
				<CategoryMenu />
			</div>

			<div className="grow p-6 flex flex-col justify-start items-start gap-4  ">
				<div className="mx-auto  w-full">
					<ProductsWidget.SearchBox />
				</div>
				<div className="flex gap-4 w-full flex-wrap justify-center grow">
					<ProductsWidget.Products emptyStateAction={() => {}}>
						{(products) => {
							return products.map((product) => {
								return <ProductRender key={product.id} product={product} />;
							});
						}}
					</ProductsWidget.Products>
				</div>
			</div>
			<div className="hidden  md:flex w-96 flex-col sticky top-0 h-[calc(100vh-64px)]">
				<div className="grow h-full">
					<Cart />
				</div>
				<div className="p-4 shrink-0 mt-auto border-t">
					<Button
						isDisabled={!cartCost?.items?.length}
						fullWidth
						onPress={() =>
							navigate({
								to: "store.cart",
							})
						}
					>
						{t("common:goToCart")} {formatter.price(cartCost.productsCost)}
					</Button>
				</div>
			</div>
		</div>
	);
}
