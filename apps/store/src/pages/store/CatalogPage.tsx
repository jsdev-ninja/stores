import { Divider, Selection } from "@nextui-org/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { CategorySlice } from "src/domains/Category";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";
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
				.map(([depth, name]) => {
					return name ? `categoryNames:"${decodeURIComponent(name)}"` : "";
				})
				.filter(Boolean)
				.join(" OR ")
		: "";

	console.log("filter", filter);

	return (
		<ProductsWidget filter={filter}>
			<div className="flex w-full h-full">
				<div className="flex-shrink-0 w-80  overflow-auto  sticky top-0 h-[calc(100vh-64px)]">
					{/* <SideNavigator /> */}
					<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
				</div>
				<div className="flex-grow p-6 flex flex-col justify-start items-start gap-4">
					<div className="mx-4  w-full">
						<ProductsWidget.SearchBox />
					</div>
					<div className="flex flex-col gap-6">
						{!isEmpty &&
							categories.map((category) => {
								return (
									<div className="flex flex-col gap-4" key={category.id}>
										<div className="font-semibold text-2xl">
											{category.locales[0].value}
										</div>
										<div className="flex gap-4 flex-wrap flex-grow">
											<ProductsWidget.Products>
												{(products) => {
													return products.map((product) => {
														return (
															<ProductRender key={product.id} product={product} />
														);
													});
												}}
											</ProductsWidget.Products>
										</div>
										<div className="flex flex-wrap gap-4">
											{category.children.map((category) => {
												return (
													<div
														className="flex-grow border py-10 rounded-lg px-6 gap-4"
														key={category.id}
													>
														<div className="font-semibold text-2xl">
															{category.locales[0].value}
														</div>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
					</div>
					{!!isEmpty && (
						<div className="flex gap-4 flex-wrap flex-grow">
							<ProductsWidget.Products>
								{(products) => {
									return products.map((product) => {
										return <ProductRender key={product.id} product={product} />;
									});
								}}
							</ProductsWidget.Products>
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
