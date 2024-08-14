import { VariantProps, tv } from "tailwind-variants";
import { useProduct } from "./useProduct";

const style = tv({
	base: "text-gray-500  font-semibold inline",
	variants: {
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg",
			x2lg: "text-2xl",
			x3lg: "text-3xl",
			x4lg: "text-4xl",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

type StyleProps = VariantProps<typeof style>;

type Props = StyleProps;
export function ProductSupplier(props: Props) {
	const { product } = useProduct();
	if (!product) return null;

	const supplier = product.supplier ?? "";
	return <div className={style(props)}>{supplier}</div>;
}
