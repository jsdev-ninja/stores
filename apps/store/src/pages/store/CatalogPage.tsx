import { Divider } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { Product } from "src/widgets/Product";
import { ProductsWidget } from "src/widgets/Products";
import { SideNavigator } from "src/widgets/SideNavigator";

export function CatalogPage() {
	const { t } = useTranslation(["common"]);
	return (
		<div className="flex w-full h-full">
			<div className="flex-shrink-0 w-80  overflow-auto  sticky top-0 h-[calc(100vh-64px)]">
				<SideNavigator />
			</div>
			<div className="flex-grow p-6 flex flex-wrap justify-center items-start gap-4">
				<div className="mx-4  w-full">
					<ProductsWidget.SearchBox />
				</div>
				<div className="flex gap-4 flex-wrap justify-center">
					<ProductsWidget.Products>
						{(products) => {
							return products.map((product) => (
								<Product key={product.id} product={product}>
									<div
										className="shadow p-4 w-64 h-96 flex flex-col bg-gray-50 rounded-2xl"
										onClick={async () => {
											navigate({
												to: "store.product",
												params: { id: product.id },
												state: { product },
											});
										}}
									>
										<div className="w-32 h-32 mx-auto">
											<Product.Image prefix="productCard" />
										</div>
										<div className="flex flex-col gap-1 mt-4">
											<Product.Name />
											<div className="flex gap-1">
												<Product.Price />
											</div>

											<div className="flex items-center gap-2">
												<Product.Weight />
												<Divider orientation="vertical" />
												<Product.ProductBrand />
											</div>
										</div>
										<div className="flex items-center gap-2 my-4"></div>
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
	);
}
