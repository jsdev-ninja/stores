import { createContext } from "react";
import { TProduct } from "src/domains";

export type ProductContextType = {
	product: TProduct | null;
};
export const ProductContext = createContext<ProductContextType>({
	product: null,
});
