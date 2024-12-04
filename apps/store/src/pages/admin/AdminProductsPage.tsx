import { useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { TProduct } from "src/domains";
import { navigate } from "src/navigation";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";

import { ProductsWidget } from "src/widgets/Products";

export function AdminProductsPage() {
	const appApi = useAppApi();

	function deleteProduct(product: TProduct) {
		appApi.admin.productDelete({ product });
	}

	const [category, setCategory] = useState<string>("");

	const filter = `categoryNames:"${decodeURIComponent(category)}"`;

	return (
		<ProductsWidget filter={category ? filter : ""}>
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
						<CategoryMenu onSelect={setCategory} selected={category} />
					</div>
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidget.Products>
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
