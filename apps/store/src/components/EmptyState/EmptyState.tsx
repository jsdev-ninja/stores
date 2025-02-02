import { Button } from "@nextui-org/react";
import { ReactNode } from "react";
import { tv } from "tailwind-variants";

type Props = {
	title?: ReactNode;
	description?: ReactNode;
	img?: string;
	action?: {
		onClick: () => void;
		title: string;
	};
	size?: "sm" | "md" | "lg";
};

const styles = tv({
	slots: {
		img: "",
		title: "",
	},
	variants: {
		size: {
			sm: {
				img: "size-24",
				title: "text-xl",
			},
			md: {
				img: "size-16 md:size-36",
				title: "text-2xl",
			},
			lg: {
				img: "size-24 md:size-48",
				title: "text-4xl",
			},
		},
	},
});
export const EmptyState = (props: Props) => {
	const { title, description, action, img, size = "lg" } = props;

	const classes = styles({ size });

	return (
		<div className="text-center flex flex-col items-center  gap-4 min-w-80">
			{!!img && <img src={img} className={classes.img()} alt="" />}
			<div className={classes.title()}>{title}</div>
			<div className="text-gray-500">{description}</div>
			{!!action && (
				<div className="min-w-48">
					<Button color="primary" fullWidth onPress={action.onClick}>
						{action.title}
					</Button>
				</div>
			)}
		</div>
	);
};
