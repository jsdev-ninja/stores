import { HierarchicalMenu } from "react-instantsearch";
import { Button } from "src/components/Button/Button";
import { navigate, useParams } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { Product } from "src/widgets/Product";
import { ProductsSearch, ProductsWidget } from "src/widgets/Products";
import { SideNavigator } from "src/widgets/SideNavigator";

export function CatalogPage() {
	const params = useParams("store.category");
	console.log("params", params);

	return (
		<div className="flex w-full h-full">
			<div className="flex-shrink-0  overflow-auto h-full">
				<SideNavigator />
			</div>
			<div className="flex-grow p-6 flex flex-wrap justify-center items-start gap-4">
				<ProductsWidget categories={params.subCategory}>
					<ProductsSearch />
					<div className="flex gap-4 flex-wrap justify-center">
						<ProductsWidget.Products>
							{(products) => {
								return products.map((product) => (
									<Product key={product.id} product={product}>
										<div
											className="shadow p-4 w-64"
											onClick={() => {
												navigate("store.product", { id: product.id });
											}}
										>
											<div className="w-32 h-32">
												<Product.Image />
											</div>
											<div className="flex flex-col gap-1 mt-4">
												<Product.Name />
												<div className="flex gap-1">
													<Product.Price />
												</div>

												<div className="">
													<Product.Weight />
												</div>

												<div className="mt-6 w-full">
													<Product.CartButton size="md" />
												</div>
											</div>
										</div>
									</Product>
								));
							}}
						</ProductsWidget.Products>
					</div>
				</ProductsWidget>
			</div>
			<div className="w-[500px] flex flex-col  flex-shrink-0">
				<Cart />
				<div className="p-4">
					<Button fullWidth onClick={() => navigate("store.cart")}>
						Go to cart
					</Button>
				</div>
			</div>
		</div>
	);
}
