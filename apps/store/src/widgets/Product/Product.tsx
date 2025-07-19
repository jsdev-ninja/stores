import { ReactNode } from "react";
import { ProductContext, ProductContextType } from "./ProductContext";
import { useProduct } from "./useProduct";
import { ProductCartButton } from "./ProductCartButton";
import { tv } from "tailwind-variants";
import { ProductName } from "./ProductName";
import { ProductSku } from "./ProductSku";
import { ProductVat } from "./ProductVat";
import { ProductPriceType } from "./ProductPriceType";
import { ProductDiscount } from "./ProductDiscount";
import { ProductVolume } from "./ProductVolume";
import { ProductWeight } from "./ProductWeight";
import { ProductBrand } from "./ProductBrand";
import { ProductManufacturer } from "./ProductManufacturer";
import { ProductSupplier } from "./ProductSupplier";
import { TProduct } from "@jsdev_ninja/core";
import { ProductAddToFavorite } from "./ProductAddToFavorite";
import { ProductDiscountBadge } from "./ProductDiscountBadge";
import { formatter } from "src/utils/formatter";

export type ProductProps = {
	product: TProduct;
	children: ReactNode;
};

export function Product(props: ProductProps) {
	const { product, children } = props;

	const context: ProductContextType = { product };

	return <ProductContext.Provider value={context}>{children}</ProductContext.Provider>;
}

const style = tv({
	base: "h-full w-full rounded object-contain  group-hover:scale-125 group-hover:rotate-6 transition duration-500 ",
});

Product.ProductAddToFavorite = ProductAddToFavorite;

Product.Image = function Image({ prefix }: { prefix?: string }) {
	const { product } = useProduct();

	const src = product?.images?.[0]?.url || "/No-Image-Placeholder.png";

	if (!product?.id) return null;

	return (
		<img
			style={{
				viewTransitionName: prefix ? `${prefix ?? ""}-product-image-${product.id}` : undefined,
			}}
			className={style({ className: "" })}
			src={src}
		/>
	);
};

Product.Description = function Description() {
	const { product } = useProduct();
	const description = product?.description?.[0]?.value;

	return <div className="text-gray-400">{description}</div>;
};

Product.Price = function Price() {
	const { product } = useProduct();

	if (!product) return null;

	const finalPrice = getPriceAfterDiscount(product);

	return (
		<p className="text-lg font-bold text-primary-500 dark:text-white">
			{formatter.price(finalPrice)}
		</p>
	);
};
Product.OriginalPrice = function Price() {
	const { product } = useProduct();

	if (!product || !product.discount || product.discount.type === "none") return null;

	return (
		<p className="text-sm font-bold line-through text-gray-400">
			{formatter.price(product.price)}
		</p>
	);
};
Product.Currency = function Currency() {
	const { product } = useProduct();

	return <div className="text-secondary-main">{product?.currency}</div>;
};

Product.CartButton = ProductCartButton;
Product.Name = ProductName;
Product.Sku = ProductSku;
Product.Vat = ProductVat;
Product.PriceType = ProductPriceType;
Product.Discount = ProductDiscount;
Product.DiscountBadge = ProductDiscountBadge;
Product.Volume = ProductVolume;
Product.Weight = ProductWeight;
Product.ProductBrand = ProductBrand;
Product.ProductManufacturer = ProductManufacturer;
Product.Supplier = ProductSupplier;

function getPriceAfterDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		const dscountAmount = (product.price * product.discount.value) / 100;
		return product.price - dscountAmount;
	}
	if (product.discount?.type === "number") {
		const dscountAmount = product.price - product.discount.value;
		return dscountAmount;
	}
	return product.price;
}
