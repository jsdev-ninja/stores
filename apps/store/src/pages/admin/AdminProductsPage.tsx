import { Tabs, Tab } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { navigate } from "src/navigation";
import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";
import { Product } from "src/widgets/Product";

import { ProductsWidgetAdmin } from "src/widgets/Products";

const TAB_ALL = "all";
const TAB_WITHOUT_IMAGE = "noImage";

export function AdminProductsPage() {
	const appApi = useAppApi();
	const [activeTab, setActiveTab] = useState<string>(TAB_ALL);
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

				<Tabs
					selectedKey={activeTab}
					onSelectionChange={(key) => setActiveTab(key as string)}
					aria-label="Products view tabs"
					className="px-4"
				>
					<Tab key={TAB_ALL} title={t("admin:productsPage.tabAll")} />
					<Tab key={TAB_WITHOUT_IMAGE} title={t("admin:productsPage.tabWithoutImage")} />
				</Tabs>

				<div className="flex">
					<div id="SideNavigator" className="w-[240px] flex-shrink-0 max-h-full">
						<CategoryMenu isAdmin />
					</div>
					<div className="flex-grow p-4 flex flex-wrap gap-4">
						<ProductsWidgetAdmin.Products emptyStateAction={() => {}}>
							{(products) => {
								const filtered =
									activeTab === TAB_WITHOUT_IMAGE
										? products.filter((p) => !p.images?.length)
										: products;

								if (activeTab === TAB_WITHOUT_IMAGE && filtered.length === 0) {
									return (
										<div className="mx-auto self-center">
											<EmptyState
												title={t("admin:productsPage.noImageEmptyTitle")}
												description={t("admin:productsPage.noImageEmptyDescription")}
											/>
										</div>
									);
								}

								return filtered.map((product) => (
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
