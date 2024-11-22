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

	const finalPriceView = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: product.currency,
	}).format(finalPrice);

	return <div className="text-base font-bold text-gray-900 dark:text-white">{finalPriceView}</div>;
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
