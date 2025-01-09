import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryCard } from "src/components/CategoryCard/CategoryCard";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { ProductsWidget } from "src/widgets/Products";

export function CatalogPage() {
	const { t } = useTranslation(["common"]);

	const categories = useAppSelector(CategorySlice.selectors.selectCategories);

	console.log("categories", categories);

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

	console.log("selectedKeys", selectedCategory);

	const isEmpty = !selectedCategory["0"];

	const filter = !isEmpty
		? Object.entries(selectedCategory)
				.map(([, name]) => {
					return name ? `categoryNames:"${decodeURIComponent(name)}"` : "";
				})
				.filter(Boolean)
				.join(" OR ")
		: "";

	return (
		<ProductsWidget filter={filter}>
			<div className="flex w-full h-full">
				<div className="flex-shrink-0 w-80  overflow-auto p-4 sticky top-0 h-[calc(100vh-64px)]">
					{/* <SideNavigator /> */}
					<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
				</div>
				<div className="flex-grow p-6 flex flex-col justify-start items-start gap-4">
					<div className="mx-4  w-full">
						<ProductsWidget.SearchBox />
					</div>
					<div className="flex flex-col gap-6">
						{!isEmpty && (
							<div className="flex gap-4 flex-wrap flex-grow">
								<ProductsWidget.Products>
									{(products) => {
										return products.map((product) => {
											console.log(product);

											return <ProductRender key={product.id} product={product} />;
										});
									}}
								</ProductsWidget.Products>
							</div>
						)}
					</div>
					{!!isEmpty && (
						<div className="flex flex-col gap-8 flex-grow">
							{categories.map((category) => {
								return (
									<div key={category.id} className="flex flex-col gap-4">
										<div className="">{category.locales[0].value}</div>
										<div className="flex gap-4 flex-wrap">
											{category.children.map((subCategory) => {
												return (
													<CategoryCard
														onClick={() =>
															setSelectedCategory({
																...selectedCategory,
																"0": category.locales[0].value,
																"1": subCategory.locales[0].value,
															})
														}
														category={subCategory}
														key={subCategory.id}
													/>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
				<div className="w-[300px] flex flex-col flex-shrink-0 sticky top-0 h-[calc(100vh-64px)]">
					<div className="flex-grow overflow-hidden">
						<Cart />
					</div>
					<div className="p-4 flex-shrink-0 mt-auto border-t">
						<Button
							fullWidth
							onClick={() =>
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
