import { TProduct } from "@jsdev_ninja/core";
import { createContext } from "react";

export type ProductContextType = {
	product: TProduct | null;
};
export const ProductContext = createContext<ProductContextType>({
	product: null,
});
