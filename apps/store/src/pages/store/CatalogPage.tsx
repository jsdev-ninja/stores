import { getCartCost } from "@jsdev_ninja/core";
import { useState } from "react";
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

	const [selectedCategory, setSelectedCategory] = useState<{
		0: string;
		1: string;
		2: string;
		3: string;
		4: string;
	}>({
		0: "",
		1: "",
		2: "",
		3: "",
		4: "",
	});

	const topCategory = Object.values(selectedCategory);
	const index = topCategory.findLastIndex((el) => !!el);

	const cart = useCart();
	const discounts = useDiscounts();

	if (!store) return null;

	const cartCost = getCartCost({ cart: cart?.items ?? [], discounts, store });

	const categoryName =
		selectedCategory[index.toString() as unknown as keyof typeof selectedCategory];

	const filter = categoryName
		? `(categoryIds:'${decodeURIComponent(categoryName)}'  AND isPublished:true)`
		: "isPublished:true";

	return (
		<ProductsWidget filter={filter}>
			<div className="flex w-full h-full">
				<div className="hidden md:block flex-shrink-0 max-w-80 flex-grow  overflow-auto p-4 sticky top-0 h-[calc(100vh-64px)]">
					<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
				</div>
				<div className="flex-grow p-6 flex flex-col justify-start items-start gap-4  ">
					<div className="mx-auto  w-full">
						<ProductsWidget.SearchBox />{" "}
					</div>
					<div className="flex gap-4 w-full flex-wrap justify-center flex-grow">
						<ProductsWidget.Products
							emptyStateAction={() => {
								setSelectedCategory({
									0: "",
									1: "",
									2: "",
									3: "",
									4: "",
								});
							}}
						>
							{(products) => {
								console.log("products", products);

								return products.map((product) => {
									return <ProductRender key={product.id} product={product} />;
								});
							}}
						</ProductsWidget.Products>
					</div>
				</div>
				<div className="hidden  md:flex min-w-[280px] flex-grow max-w-[300px] flex-col sticky top-0 h-[calc(100vh-64px)]">
					<div className="flex-grow h-full">
						<Cart />
					</div>
					<div className="p-4 flex-shrink-0 mt-auto border-t">
						<Button
							isDisabled={!cartCost?.items?.length}
							fullWidth
							onPress={() =>
								navigate({
									to: "store.cart",
								})
							}
						>
							{t("common:goToCart")} {formatter.price(cartCost.finalCost)}
						</Button>
					</div>
				</div>
			</div>
		</ProductsWidget>
	);
}
