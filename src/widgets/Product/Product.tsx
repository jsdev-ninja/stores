import { ReactNode } from "react";
import { TProduct } from "src/domains";
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

export type ProductProps = {
	product: TProduct;
	children: ReactNode;
};

// categories: z.array(
// 	z.object({
// 		tag: z.string(),
// 		id: z.string(),
// 	})
// ),

export function Product(props: ProductProps) {
	const { product, children } = props;

	const context: ProductContextType = { product };

	return <ProductContext.Provider value={context}>{children}</ProductContext.Provider>;
}

const style = tv({
	base: "h-full w-full rounded object-contain  group-hover:scale-125 group-hover:rotate-6 transition duration-500 ",
});

Product.Image = function Image() {
	const { product } = useProduct();

	const src = product?.images?.[0]?.url || "/No-Image-Placeholder.png";

	return <img className={style({ className: "" })} src={src} />;
};

Product.Description = function Description() {
	const { product } = useProduct();
	return <div className="text-gray-400">{product?.description}</div>;
};

Product.Price = function Price() {
	const { product } = useProduct();

	if (!product) return null;

	const finalPrice = getPriceAfterDiscount(product);

	const priceView = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: product.currency,
	}).format(product.price);

	const finalPriceView = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: product.currency,
	}).format(finalPrice);

	console.log('product',product.discount);
	

	return (
		<div className="flex gap-1 items-center">
			<div className="text-secondary-main font-semibold">{finalPriceView}</div>
			{!!product.discount && <div className="text-gray-400 line-through">{priceView}</div>}
		</div>
	);
};
Product.Currency = function Currency() {
	const { product } = useProduct();

	return <div className="text-secondary-main">{product?.currency}</div>;
};

Product.Weight = function Weight() {
	const { product } = useProduct();
	if (!product) return null;

	return (
		<div className="text-gray-300">
			{product.weight?.value} {product.weight?.unit}
		</div>
	);
};

Product.CartButton = ProductCartButton;
Product.Name = ProductName;
Product.Sku = ProductSku;
Product.Vat = ProductVat;
Product.PriceType = ProductPriceType;
Product.Discount = ProductDiscount;
Product.Volume = ProductVolume;
Product.Weight = ProductWeight;

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
