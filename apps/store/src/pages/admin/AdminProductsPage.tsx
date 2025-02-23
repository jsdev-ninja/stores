import { TProduct } from "@jsdev_ninja/core";
import { useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";

import { ProductsWidget } from "src/widgets/Products";

export function AdminProductsPage() {
	const appApi = useAppApi();

	function deleteProduct(product: TProduct) {
		appApi.admin.productDelete({ product });
	}

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
			<div className="">
				<div className="flex items-center">
					<div className="mx-4 flex-grow">
						<ProductsWidget.SearchBox />
					</div>
					<div className="p-4 flex items-center gap-4">
						<Button
							onClick={() =>
								navigate({
									to: "admin.addProduct",
								})
							}
						>
							Create Product
						</Button>
					</div>
				</div>

				<div className="flex">
					<div id="SideNavigator" className="w-[240px] flex-shrink-0 max-h-full">
						{/* <ProductsWidget.Filter /> */}
						<CategoryMenu value={selectedCategory} onValueChange={setSelectedCategory} />
					</div>
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidget.Products
							emptyStateAction={() => {
								// todo
							}}
						>
							{(products) => {
								console.log("products", products);

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
													onClick={() =>
														navigate({
															to: "admin.editProduct",
															params: { id: product.id },
															state: { product },
														})
													}
													fullWidth
												>
													Edit
												</Button>
												<Button onClick={() => deleteProduct(product)} fullWidth>
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
