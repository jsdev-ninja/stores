import { VariantProps, tv } from "tailwind-variants";
import { useProduct } from "./useProduct";

const style = tv({
	base: "font-medium text-gray-900 hover:underline dark:text-white",
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
export function ProductName(props: Props) {
	const { product } = useProduct();
	if (!product) return null;

	const name = product?.locales?.[0]?.value;
	return <div className={style(props)}>{name}</div>;
}
