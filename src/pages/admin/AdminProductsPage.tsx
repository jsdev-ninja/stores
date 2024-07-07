import { HierarchicalMenu } from "react-instantsearch";
import { Button } from "src/components/Button/Button";
import { navigate } from "src/navigation";
import { Product } from "src/widgets/Product";

import { ProductsSearch, ProductsWidget } from "src/widgets/Products";

export function AdminProductsPage() {
	return (
		<ProductsWidget>
			<div className="">
				<div className="p-4 flex items-center gap-4">
					<div className="flex-grow">
						<ProductsSearch />
					</div>
					<Button onClick={() => navigate("admin.addProduct")}>Create Product</Button>
				</div>

				<div className="flex">
					<div className="w-96 shrink-0">
						hi
						<HierarchicalMenu
							attributes={[
								"categories.lvl0",
								"categories.lvl1",
								"categories.lvl2",
								"categories.lvl3",
							]}
						/>
					</div>
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
												<Product.Unit />
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
														navigate("admin.editProduct", { id: product.id })
													}
													fullWidth
												>
													Edit
												</Button>
												<Button fullWidth>Delete</Button>
											</div>
										</div>
									</Product>
								));
							}}
						</ProductsWidget.Products>
					</div>
					{/* <div className="w-80 shrink-0">sidebar</div> */}
				</div>
			</div>
		</ProductsWidget>
	);
}
