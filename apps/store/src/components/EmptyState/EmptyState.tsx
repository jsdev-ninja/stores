import { Button } from "@nextui-org/react";
import { ReactNode } from "react";

type Props = {
	title?: ReactNode;
	description?: ReactNode;
	img?: string;
	action?: {
		onClick: () => void;
		title: string;
	};
};
export const EmptyState = (props: Props) => {
	const { title, description, action, img } = props;

	return (
		<div className="text-center flex flex-col items-center  gap-4 min-w-80">
			{!!img && <img src={img} className="size-24 md:size-48" alt="" />}
			<div className="font-bold text-4xl">{title}</div>
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
