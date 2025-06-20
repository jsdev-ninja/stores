import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";

import { ProductsWidget } from "src/widgets/Products";

export function AdminProductsPage() {
	const appApi = useAppApi();

	const { t } = useTranslation(["common", "admin"]);

	const [selectedCategory, setSelectedCategory] = useState<{
		0: string;
		1: string;
		2: string;
		3: string;
		4: string;
	}>(() => {
		const queryString = window.location.search; // e.g. "?name=John&age=30"
		// eslint-disable-next-line compat/compat

		const historyState: Record<string, string> = window.history.state?.selectedCategory ?? null;

		const navigateParams =
			!!historyState &&
			Object.fromEntries(
				// eslint-disable-next-line compat/compat
				new URLSearchParams(
					Object.fromEntries(
						Object.entries(historyState).filter(([_, value]) => Boolean(value))
					)
				)
			);

		const params: any = historyState
			? navigateParams
			: // eslint-disable-next-line compat/compat
			  Object.fromEntries(new URLSearchParams(queryString));

		return {
			0: params["0"] ?? "",
			1: params["1"] ?? "",
			2: params["2"] ?? "",
			3: params["3"] ?? "",
			4: params["4"] ?? "",
		};
	});

	useEffect(() => {
		// eslint-disable-next-line compat/compat
		const queryParams = new URLSearchParams(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			Object.fromEntries(Object.entries(selectedCategory).filter(([_, value]) => Boolean(value)))
		).toString();

		window.history.replaceState({}, "", `${window.location.pathname}?${queryParams}`);
	}, [selectedCategory]);

	const topCategory = Object.values(selectedCategory);
	const index = topCategory.findLastIndex((el) => !!el);

	const categoryName =
		selectedCategory[index.toString() as unknown as keyof typeof selectedCategory];

	const filter = categoryName ? `categoryIds:'${decodeURIComponent(categoryName)}'` : "";

	return (
		<ProductsWidget filter={filter}>
			<div className="">
				<div className="flex items-center">
					<div className="mx-4 flex-grow">
						<ProductsWidget.SearchBox />
					</div>
					<div className="p-4 flex items-center gap-4">
						<Button
							onPress={() =>
								navigate({
									to: "admin.addProduct",
								})
							}
							color="primary"
						>
							{t("admin:productsPage.addProduct")}
						</Button>
					</div>
				</div>

				<div className="flex">
					<div id="SideNavigator" className="w-[240px] flex-shrink-0 max-h-full">
						<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
					</div>
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidget.Products emptyStateAction={() => {}}>
							{(products) => {
								return products.map((product) => (
									<Product key={product.id} product={product}>
										<div className="w-80 shadow p-4 flex flex-col h-fit ">
											<div className="h-40 w-40 mx-auto">
												<Product.Image />
											</div>

											<div className="my-2">
												<Product.Name />
											</div>
											<Product.Description />
											<Product.Price />
											<div className="flex ga-1">
												Discount:
												<Product.Discount />
											</div>
											<Product.Sku />
											<Product.Vat />
											<div className="flex gap-1">
												type:
												<Product.PriceType />
											</div>
											<div className="flex gap-1">
												Weight:
												<Product.Weight />
											</div>
											<div className="flex gap-1">
												Volume:
												<Product.Volume />
											</div>
											<div className="flex gap-4 justify-center my-4">
												<Button
													onPress={() =>
														navigate({
															to: "admin.editProduct",
															params: { id: product.id },
															state: { product, selectedCategory },
														})
													}
													fullWidth
												>
													Edit
												</Button>
												<Button
													onPress={() => appApi.admin.productDelete({ product })}
													fullWidth
												>
													Delete
												</Button>
											</div>
										</div>
									</Product>
								));
							}}
						</ProductsWidget.Products>
					</div>
				</div>
			</div>
		</ProductsWidget>
	);
}
