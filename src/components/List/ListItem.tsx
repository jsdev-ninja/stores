import { ReactNode } from "react";
import { ListBoxItem } from "react-aria-components";

type Props = {
	children: ReactNode;
};

export function ListItem({ children }: Props) {
	return <ListBoxItem>{children}</ListBoxItem>;
}
