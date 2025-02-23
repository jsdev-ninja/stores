import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { ProductsWidget } from "src/widgets/Products";

export function CatalogPage() {
	const { t } = useTranslation(["common"]);

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
	console.log("index", index);

	const categoryName =
		selectedCategory[index.toString() as unknown as keyof typeof selectedCategory];

	const filter = categoryName ? `categoryNames:'${decodeURIComponent(categoryName)}'` : "";

	console.log("filter", filter);

	return (
		<ProductsWidget filter={filter}>
			<div className="flex w-full h-full">
				<div className="hidden md:block flex-shrink-0 max-w-80 flex-grow  overflow-auto p-4 sticky top-0 h-[calc(100vh-64px)]">
					<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
				</div>
				<div className="flex-grow p-6 flex flex-col justify-start items-start gap-4  ">
					<div className="mx-auto  w-full">
						{/* <ProductsWidget.SearchBox /> */}
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
								return products.map((product) => {
									return <ProductRender key={product.id} product={product} />;
								});
							}}
						</ProductsWidget.Products>
					</div>
				</div>
				<div className="hidden  md:flex min-w-[280px] flex-grow max-w-[300px] flex-col sticky top-0 h-[calc(100vh-64px)]">
					<div className="flex-grow">
						<Cart />
					</div>
					<div className="p-4 flex-shrink-0 mt-auto border-t">
						<Button
							fullWidth
							onPress={() =>
								navigate({
									to: "store.cart",
								})
							}
						>
							{t("common:goToCart")}
						</Button>
					</div>
				</div>
			</div>
		</ProductsWidget>
	);
}
