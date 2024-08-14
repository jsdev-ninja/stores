import classNames from "classnames";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TProduct } from "src/domains";
import { ProductService } from "src/domains/product/productService";
import { useParams } from "src/navigation";
import { Product } from "src/widgets/Product";

export function ProductPage() {
	const params = useParams("store.product");

	const { t } = useTranslation();

	const [product, setProduct] = useState<TProduct | null>(() => {
		const state = history.state?.product;
		if (state) {
			// todo: clear history state
			history.pushState({}, window.location.pathname);
		}
		return state ?? null;
	});

	useEffect(() => {
		if (!params.id || !!product) return;

		ProductService.get(params.id).then((result) => {
			setProduct(result.data as TProduct);
		});
	}, [params.id]);

	if (!product) return null;

	return (
		<Product product={product}>
			<div
				className={classNames("m-4 rounded-lg mx-auto max-w-screen-lg", "md:flex md:my-auto")}
			>
				<div className={classNames("h-96 w-96")}>
					<Product.Image prefix="productCard" />
				</div>
				<div className="mx-4">
					<div className="">
						<Product.Name size="x4lg" />
					</div>

					<div className="">
						<Product.Description />
					</div>

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

					<div className="">
						<Product.Price />
					</div>
					<div className="my-4">
						<Product.CartButton size="md" />
					</div>
				</div>
			</div>
		</Product>
	);
}
