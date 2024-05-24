import { ListBox } from "react-aria-components";
import { ListItem } from "./ListItem";
import { ReactNode } from "react";

export function List({ children }: { children: ReactNode }) {
	return (
		<ListBox aria-label="" selectionMode="single">
			{children}
		</ListBox>
	);
}

List.Item = ListItem;
