import { TProduct } from "@jsdev_ninja/core";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { useParams, navigate } from "src/navigation";
import { Product } from "src/widgets/Product";
import { useStore } from "src/domains/Store";
import { recordRecentlyViewed } from "src/utils/recentlyViewed";

export function ProductPage() {
	const params = useParams("store.product");

	const { t } = useTranslation(["common"]);

	const appApi = useAppApi();
	const store = useStore();

	const [product, setProduct] = useState<TProduct | null>(null);

	// On mount: hydrate from navigation state (browser only) first, then fall
	// back to a network fetch if no state was carried over.
	useEffect(() => {
		const state = typeof history !== "undefined" ? history.state?.product : null;
		if (state) {
			setProduct(state);
			// todo history.replaceState({}, window.location.pathname);
			return;
		}
		if (!params.id) return;
		appApi.system.getProductById({ id: params.id }).then((res) => {
			if (res?.success) {
				setProduct(res.data);
			}
		});
	}, [params.id]);

	// Track the opened product for the "recently viewed" rail (client-only, per store).
	useEffect(() => {
		if (product && store?.id) recordRecentlyViewed(store.id, product);
	}, [product, store?.id]);

	if (!product) return null;

	return (
		<Product product={product}>
			<section className="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased">
				<div className="max-w-screen-xl px-4 mx-auto 2xl:px-0">
					<div className="mb-4">
						<Button variant="ghost" onPress={() => navigate({ to: "store.catalog" })}>
							<Icon icon="lucide:arrow-right" />
							{t("common:back")}
						</Button>
					</div>
					<div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
						<div className="shrink-0 max-w-md lg:max-w-lg mx-auto">
							<Product.Image prefix="productCard" />
						</div>
						<div className="mt-6 sm:mt-8 lg:mt-0">
							<h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
								<Product.Name size="x4lg" />
							</h1>
							<div className="mt-4 sm:items-center sm:gap-4 sm:flex">
								<p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
									<Product.Price />
								</p>
							</div>
							<div className="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
								<div>
									<Product.CartButton size="md" />
								</div>
							</div>
							<hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

							<div className="flex gap-2 my-4">
								<div className="">
									<div className="text-primary-main font-bold">{t("brand")}</div>
									<Product.ProductBrand />
								</div>
								<div className="">
									<div className="text-primary-main font-bold">{t("manufacturer")}</div>
									<Product.ProductManufacturer />
								</div>
								<div className="">
									<div className="text-primary-main font-bold">{t("supplier")}</div>
									<Product.Supplier />
								</div>
							</div>
							<hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />
							<p className="mb-6 text-gray-500 dark:text-gray-400">
								<Product.Description />
							</p>
						</div>
					</div>
				</div>
			</section>
		</Product>
	);
}
