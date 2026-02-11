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
			<div className="hidden md:block shrink-0 max-w-80 grow overflow-auto p-4 sticky top-0 h-[calc(100vh-64px)]">
				<CategoryMenu />
			</div>

			<div className="grow p-3 md:p-6 flex flex-col justify-start items-start gap-4 min-w-0">
				<div className="mx-auto w-full">
					<ProductsWidget.SearchBox />
				</div>
				{/* Small screen only: 2-col grid. Desktop: original flex wrap, no change */}
				<div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-4 md:justify-center w-full grow content-start">
					<ProductsWidget.Products emptyStateAction={() => {}}>
						{(products) => {
							return products.map((product) => {
								return (
									<div
										key={product.id}
										className="w-full min-w-0 flex justify-center md:w-auto"
									>
										<ProductRender product={product} />
									</div>
								);
							});
						}}
					</ProductsWidget.Products>
				</div>
			</div>

			{/* Desktop cart sidebar */}
			<div className="hidden md:flex min-w-80 flex-col sticky top-0 h-[calc(100vh-64px)]">
				<div className="grow h-full">
					<Cart />
				</div>
				<div className="p-4 shrink-0 mt-auto border-t">
					<Button
						isDisabled={!cartCost?.items?.length}
						fullWidth
						onPress={() => navigate({ to: "store.cart" })}
					>
						{t("common:goToCart")} {formatter.price(cartCost.cost)}
					</Button>
				</div>
			</div>

			{/* Mobile: sticky cart bar so user can go to cart */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-background border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
				<Button
					isDisabled={!cartCost?.items?.length}
					fullWidth
					size="lg"
					onPress={() => navigate({ to: "store.cart" })}
				>
					{t("common:goToCart")} {formatter.price(cartCost.cost)}
				</Button>
			</div>
			{/* Spacer so content is not hidden behind fixed cart bar on mobile */}
			<div className="md:hidden h-16 shrink-0" aria-hidden />
		</div>
	);
}
