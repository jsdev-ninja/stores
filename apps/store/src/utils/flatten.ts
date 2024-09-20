import { FlattenedItem, TreeItems } from "src/widgets/Category/CategoryTree/utils";

export function flatten(
	items: TreeItems,
	parentId: string | null = null,
	depth = 0
): FlattenedItem[] {
	return items.reduce<FlattenedItem[]>((acc, item: any, index: number) => {
		return [
			...acc,
			{ ...item, parentId, depth, index },
			...flatten(item.children, item.id, depth + 1),
		];
	}, []);
}
