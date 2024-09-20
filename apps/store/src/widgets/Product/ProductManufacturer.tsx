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
export function ProductManufacturer(props: Props) {
	const { product } = useProduct();
	if (!product) return null;

	const manufacturer = product.manufacturer ?? "";
	return <div className={style(props)}>{manufacturer}</div>;
}
