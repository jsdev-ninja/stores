import { TProduct } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { navigate, useParams } from "src/navigation";
import { Product } from "src/widgets/Product";

import { ProductsWidget } from "src/widgets/Products";

export function AdminProductsByCategoryPage() {
	const appApi = useAppApi();

	const params = useParams("admin.productsByCategory");

	function deleteProduct(product: TProduct) {
		appApi.admin.productDelete({ product });
	}

	const filter = `categoryNames:"${decodeURIComponent(params.categoryName)}"`;

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
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidget.Products>
							{(products) => {
								return products.map((product) => (
									<Product key={product.id} product={product}>
										<div className="w-80 shadow p-4 flex flex-col ">
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
