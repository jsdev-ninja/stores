import { ReactNode, createContext, useContext } from "react";
import { TProduct } from "src/domains";

type ProductContextType = {
	product: TProduct | null;
};
const ProductContext = createContext<ProductContextType>({
	product: null,
});

export type ProductProps = {
	product: TProduct;
	children: ReactNode;
};

export const useProduct = () => useContext(ProductContext);

export function Product(props: ProductProps) {
	const { product, children } = props;

	const context: ProductContextType = { product };

	return (
		<ProductContext.Provider value={context}>
			<div
				data-name="Product"
				className="bg-background-paper p-4 w-[300px] rounded-lg cursor-pointer"
			>
				{children}
			</div>
		</ProductContext.Provider>
	);
}

Product.Image = function Image() {
	const { product } = useProduct();
	return (
		<div className="">
			<img src="banana.png" />
		</div>
	);
};
Product.Name = function Name() {
	const { product } = useProduct();
	return <div className="text-text-primary">{product?.name}</div>;
};
Product.Description = function Description() {
	const { product } = useProduct();
	return <div className="text-text-secondary">{product?.description}</div>;
};

Product.Price = function Price() {
	const { product } = useProduct();
	return <div className="text-primary">{product?.price.value}</div>;
};
Product.Currency = function Currency() {
	const { product } = useProduct();
	return <div className="text-primary">{product?.price.currency}</div>;
};
