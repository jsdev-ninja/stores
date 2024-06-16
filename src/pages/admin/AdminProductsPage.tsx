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
					<div className="flex-grow p-4 flex flex-col gap-4">
						<ProductsWidget.Products>
							{(products) => {
								return products.map((product) => (
									<Product key={product.id} product={product}>
										<div className="shadow p-4 flex">
											<div className="h-20 w-20">
												<Product.Image />
											</div>
											<div className="">
												<Product.Name />
												<Product.Price />
											</div>
										</div>
									</Product>
								));
							}}
						</ProductsWidget.Products>
					</div>
					<div className="w-80 shrink-0">sidebar</div>
				</div>
			</div>
		</ProductsWidget>
	);
}
