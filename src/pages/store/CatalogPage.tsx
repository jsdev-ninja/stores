// import { HierarchicalMenu } from "react-instantsearch";
import { Button } from "src/components/Button/Button";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { Product } from "src/widgets/Product";
import { ProductsWidget } from "src/widgets/Products";
import { SideNavigator } from "src/widgets/SideNavigator";

export function CatalogPage() {
	return (
		<div className="flex w-full h-full">
			<div className="flex-shrink-0 w-80  overflow-auto h-full">
				<SideNavigator />
			</div>
			<div className="flex-grow p-6 flex flex-wrap justify-center items-start gap-4">
				<div className="flex gap-4 flex-wrap justify-center">
					<ProductsWidget.Products>
						{(products) => {
							return products.map((product) => (
								<Product key={product.id} product={product}>
									<div
										className="shadow p-4 w-64 h-80 flex flex-col"
										onClick={() => {
											navigate("store.product", { id: product.id });
										}}
									>
										<div className="w-32 h-32 mx-auto">
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
										</div>
										<div className="w-full mt-auto">
											<Product.CartButton size="md" />
										</div>
									</div>
								</Product>
							));
						}}
					</ProductsWidget.Products>
				</div>
			</div>
			<div className="w-[300px] flex flex-col flex-shrink-0">
				<div className="flex-grow overflow-hidden">
					<Cart />
				</div>
				<div className="p-4 flex-shrink-0 mt-auto">
					<Button fullWidth onClick={() => navigate("store.cart")}>
						Go to cart
					</Button>
				</div>
			</div>
		</div>
	);
}
