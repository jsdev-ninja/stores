import { getCartCost, TCategory } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { navigate, useParams } from "src/navigation";
import { formatter } from "src/utils/formatter";
import { Cart } from "src/widgets/Cart/Cart";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { ProductsWidget } from "src/widgets/Products";
import { useMemo } from "react";

// Helper function to flatten categories
function flattenCategories(categories: TCategory[]): TCategory[] {
	const result: TCategory[] = [];
	categories.forEach((category) => {
		result.push(category);
		if (category.children && category.children.length > 0) {
			result.push(...flattenCategories(category.children));
		}
	});
	return result;
}

// todo why render twice when setSTATE
export function CatalogPage() {
	const { t } = useTranslation(["common"]);

	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);
	const params = useParams("store.catalog");

	// Build breadcrumb items from selected categories
	const breadcrumbItems = useMemo(() => {
		const items: Array<{ id: string; name: string; depth: number }> = [];

		// Add "Catalog" as first item (always visible)
		items.push({
			id: "",
			name: t("common:products"),
			depth: 0,
		});

		// Add selected categories in order if categories are available
		if (categories.length) {
			const flattenedCategories = flattenCategories(categories);

			for (let i = 1; i <= 5; i++) {
				const categoryId = params[`category${i}` as keyof typeof params] as string;
				if (categoryId) {
					const category = flattenedCategories.find((c) => c.id === categoryId);
					if (category) {
						items.push({
							id: categoryId,
							name: category.locales[0]?.value || categoryId,
							depth: i,
						});
					}
				}
			}
		}

		return items;
	}, [categories, params, t]);

	const handleBreadcrumbClick = (item: { id: string; depth: number }) => {
		if (!item.id) {
			// Navigate to catalog root
			navigate({
				to: "store.catalog",
				params: {
					category1: "",
					category2: "",
					category3: "",
					category4: "",
					category5: "",
				},
			});
		} else {
			// Navigate to the selected category level
			const newParams: any = {};
			for (let i = 1; i <= item.depth; i++) {
				newParams[`category${i}`] = params[`category${i}` as keyof typeof params] || "";
			}
			// Clear deeper levels
			for (let i = item.depth + 1; i <= 5; i++) {
				newParams[`category${i}`] = "";
			}
			// Set the clicked category
			newParams[`category${item.depth}`] = item.id;

			navigate({
				to: "store.catalog",
				params: newParams,
			});
		}
	};

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
				<div className="w-full">
					<Breadcrumbs>
						{breadcrumbItems.map((item, index) => (
							<BreadcrumbItem
								key={item.id || "home"}
								onPress={() => handleBreadcrumbClick(item)}
								className={index === breadcrumbItems.length - 1 ? "font-semibold" : ""}
							>
								{item.name}
							</BreadcrumbItem>
						))}
					</Breadcrumbs>
				</div>
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
			<div className="hidden  md:flex min-w-[280px] grow max-w-[300px] flex-col sticky top-0 h-[calc(100vh-64px)]">
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
