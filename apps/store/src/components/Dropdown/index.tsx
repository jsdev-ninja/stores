import { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export const Dropdown = ({ children }: { children: ReactNode }) => {
	return <DropdownMenu.Root>{children}</DropdownMenu.Root>;
};

Dropdown.Content = function Content({ children }: { children: ReactNode }) {
	return (
		<DropdownMenu.Portal>
			<DropdownMenu.Content
				className="min-w-[220px] bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
				sideOffset={5}
			>
				{children}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	);
};
Dropdown.Trigger = function Trigger({ children }: { children: ReactNode }) {
	return <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>;
};

Dropdown.Item = function Item({
	children,
	onSelect,
}: {
	children: ReactNode;
	onSelect?: (event: Event) => void;
}) {
	return (
		<DropdownMenu.Item
			onSelect={onSelect}
			className="group text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
		>
			{children}
		</DropdownMenu.Item>
	);
};
