import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";

import { ProductsWidgetAdmin } from "src/widgets/Products";

export function AdminProductsPage() {
	const appApi = useAppApi();

	const { t } = useTranslation(["common", "admin"]);

	return (
		<ProductsWidgetAdmin>
			<div className="">
				<div className="flex items-center">
					<div className="mx-4 grow">
						<ProductsWidgetAdmin.SearchBox />
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
						<CategoryMenu isAdmin />
					</div>
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidgetAdmin.Products emptyStateAction={() => {}}>
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
															state: { product },
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
						</ProductsWidgetAdmin.Products>
					</div>
				</div>
			</div>
		</ProductsWidgetAdmin>
	);
}
