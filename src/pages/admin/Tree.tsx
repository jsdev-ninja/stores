import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	Announcements,
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragStartEvent,
	DragOverlay,
	DragMoveEvent,
	DragEndEvent,
	DragOverEvent,
	MeasuringStrategy,
	DropAnimation,
	Modifier,
	defaultDropAnimation,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import type { MutableRefObject } from "react";
import { SortableTreeItem } from "./Item/Item";

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
	return Math.round(offset / indentationWidth);
}

export function getProjection(
	items: FlattenedItem[],
	activeId: string,
	overId: string,
	dragOffset: number,
	indentationWidth: number
) {
	const overItemIndex = items.findIndex(({ id }) => id === overId);
	const activeItemIndex = items.findIndex(({ id }) => id === activeId);
	const activeItem = items[activeItemIndex];
	const newItems = arrayMove(items, activeItemIndex, overItemIndex);
	const previousItem = newItems[overItemIndex - 1];
	const nextItem = newItems[overItemIndex + 1];
	const dragDepth = getDragDepth(dragOffset, indentationWidth);
	const projectedDepth = activeItem.depth + dragDepth;
	const maxDepth = getMaxDepth({
		previousItem,
	});
	const minDepth = getMinDepth({ nextItem });
	let depth = projectedDepth;

	if (projectedDepth >= maxDepth) {
		depth = maxDepth;
	} else if (projectedDepth < minDepth) {
		depth = minDepth;
	}

	return { depth, maxDepth, minDepth, parentId: getParentId() };

	function getParentId() {
		if (depth === 0 || !previousItem) {
			return null;
		}

		if (depth === previousItem.depth) {
			return previousItem.parentId;
		}

		if (depth > previousItem.depth) {
			return previousItem.id;
		}

		const newParent = newItems
			.slice(0, overItemIndex)
			.reverse()
			.find((item) => item.depth === depth)?.parentId;

		return newParent ?? null;
	}
}

function getMaxDepth({ previousItem }: { previousItem: FlattenedItem }) {
	if (previousItem) {
		return previousItem.depth + 1;
	}

	return 0;
}

function getMinDepth({ nextItem }: { nextItem: FlattenedItem }) {
	if (nextItem) {
		return nextItem.depth;
	}

	return 0;
}

function flatten(items: TreeItems, parentId: string | null = null, depth = 0): FlattenedItem[] {
	return items.reduce<FlattenedItem[]>((acc, item, index) => {
		return [
			...acc,
			{ ...item, parentId, depth, index },
			...flatten(item.children, item.id, depth + 1),
		];
	}, []);
}

export function flattenTree(items: TreeItems): FlattenedItem[] {
	return flatten(items);
}

export function buildTree(flattenedItems: FlattenedItem[]): TreeItems {
	const root: TreeItem = { id: "root", children: [] };
	const nodes: Record<string, TreeItem> = { [root.id]: root };
	const items = flattenedItems.map((item) => ({ ...item, children: [] }));

	for (const item of items) {
		const { id, children } = item;
		const parentId = item.parentId ?? root.id;
		const parent = nodes[parentId] ?? findItem(items, parentId);

		nodes[id] = { id, children };
		parent.children.push(item);
	}

	return root.children;
}

export function findItem(items: TreeItem[], itemId: string) {
	return items.find(({ id }) => id === itemId);
}

export function findItemDeep(items: TreeItems, itemId: string): TreeItem | undefined {
	for (const item of items) {
		const { id, children } = item;

		if (id === itemId) {
			return item;
		}

		if (children.length) {
			const child = findItemDeep(children, itemId);

			if (child) {
				return child;
			}
		}
	}

	return undefined;
}

export function removeItem(items: TreeItems, id: string) {
	const newItems = [];

	for (const item of items) {
		if (item.id === id) {
			continue;
		}

		if (item.children.length) {
			item.children = removeItem(item.children, id);
		}

		newItems.push(item);
	}

	return newItems;
}

export function setProperty<T extends keyof TreeItem>(
	items: TreeItems,
	id: string,
	property: T,
	setter: (value: TreeItem[T]) => TreeItem[T]
) {
	for (const item of items) {
		if (item.id === id) {
			item[property] = setter(item[property]);
			continue;
		}

		if (item.children.length) {
			item.children = setProperty(item.children, id, property, setter);
		}
	}

	return [...items];
}

function countChildren(items: TreeItem[], count = 0): number {
	return items.reduce((acc, { children }) => {
		if (children.length) {
			return countChildren(children, acc + 1);
		}

		return acc + 1;
	}, count);
}

export function getChildCount(items: TreeItems, id: string) {
	const item = findItemDeep(items, id);

	return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(items: FlattenedItem[], ids: string[]) {
	const excludeParentIds = [...ids];

	return items.filter((item) => {
		if (item.parentId && excludeParentIds.includes(item.parentId)) {
			if (item.children.length) {
				excludeParentIds.push(item.id);
			}
			return false;
		}

		return true;
	});
}

export interface TreeItem {
	id: string;
	children: TreeItem[];
	collapsed?: boolean;
}

export type TreeItems = TreeItem[];

export interface FlattenedItem extends TreeItem {
	parentId: string | null;
	depth: number;
	index: number;
}

export type SensorContext = MutableRefObject<{
	items: FlattenedItem[];
	offset: number;
}>;

const initialItems: TreeItems = [
	{
		id: "Home",
		children: [],
	},
	{
		id: "Collections",
		children: [
			{ id: "Spring", children: [] },
			{ id: "Summer", children: [] },
			{ id: "Fall", children: [] },
			{ id: "Winter", children: [] },
		],
	},
	{
		id: "About Us",
		children: [],
	},
	{
		id: "My Account",
		children: [
			{ id: "Addresses", children: [] },
			{ id: "Order History", children: [] },
		],
	},
];

const measuring = {
	droppable: {
		strategy: MeasuringStrategy.Always,
	},
};

const dropAnimationConfig: DropAnimation = {
	keyframes({ transform }) {
		console.log("transform", transform);

		return [
			{ opacity: 1, transform: CSS.Transform.toString(transform.initial) },
			{
				opacity: 0,
				transform: CSS.Transform.toString({
					...transform.final,
					x: transform.final.x + 5,
					y: transform.final.y + 5,
				}),
			},
		];
	},
	easing: "ease-out",
	sideEffects({ active }) {
		active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: defaultDropAnimation.duration,
			easing: defaultDropAnimation.easing,
		});
	},
};

interface Props {
	collapsible?: boolean;
	defaultItems?: TreeItems;
	indentationWidth?: number;
	indicator?: boolean;
	removable?: boolean;
}

export function SortableTree({
	collapsible,
	defaultItems = initialItems,
	indicator = false,
	indentationWidth = 50,
	removable,
}: Props) {
	const [items, setItems] = useState(() => defaultItems);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [offsetLeft, setOffsetLeft] = useState(0);
	const [currentPosition, setCurrentPosition] = useState<{
		parentId: string | null;
		overId: string;
	} | null>(null);

	const flattenedItems = useMemo(() => {
		const flattenedTree = flattenTree(items);
		const collapsedItems = flattenedTree.reduce<string[]>(
			(acc, { children, collapsed, id }) => (collapsed && children.length ? [...acc, id] : acc),
			[]
		);

		return removeChildrenOf(
			flattenedTree,
			activeId ? [activeId, ...collapsedItems] : collapsedItems
		);
	}, [activeId, items]);
	const projected =
		activeId && overId
			? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
			: null;
	const sensorContext: SensorContext = useRef({
		items: flattenedItems,
		offset: offsetLeft,
	});

	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {}));

	const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
	const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

	useEffect(() => {
		sensorContext.current = {
			items: flattenedItems,
			offset: offsetLeft,
		};
	}, [flattenedItems, offsetLeft]);

	const announcements: Announcements = {
		onDragStart({ active }) {
			return `Picked up ${active.id}.`;
		},
		onDragMove({ active, over }) {
			return getMovementAnnouncement("onDragMove", active.id as string, over?.id as string);
		},
		onDragOver({ active, over }) {
			return getMovementAnnouncement("onDragOver", active.id as string, over?.id as string);
		},
		onDragEnd({ active, over }) {
			return getMovementAnnouncement("onDragEnd", active.id as string, over?.id as string);
		},
		onDragCancel({ active }) {
			return `Moving was cancelled. ${active.id} was dropped in its original position.`;
		},
	};

	return (
		<DndContext
			accessibility={{ announcements }}
			sensors={sensors}
			collisionDetection={closestCenter}
			measuring={measuring}
			onDragStart={handleDragStart}
			onDragMove={handleDragMove}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
				{flattenedItems.map(({ id, children, collapsed, depth }) => (
					<SortableTreeItem
						key={id}
						id={id}
						value={id}
						depth={id === activeId && projected ? projected.depth : depth}
						indentationWidth={indentationWidth}
						indicator={indicator}
						collapsed={Boolean(collapsed && children.length)}
						onCollapse={collapsible && children.length ? () => handleCollapse(id) : undefined}
						onRemove={removable ? () => handleRemove(id) : undefined}
					/>
				))}
				{createPortal(
					<DragOverlay
						dropAnimation={dropAnimationConfig}
						modifiers={indicator ? [adjustTranslate] : undefined}
					>
						{activeId && activeItem ? (
							<SortableTreeItem
								id={activeId}
								depth={activeItem.depth}
								clone
								childCount={getChildCount(items, activeId) + 1}
								value={activeId.toString()}
								indentationWidth={indentationWidth}
							/>
						) : null}
					</DragOverlay>,
					document.body
				)}
			</SortableContext>
		</DndContext>
	);

	function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
		setActiveId(activeId as string);
		setOverId(activeId as string);

		const activeItem = flattenedItems.find(({ id }) => id === activeId);

		if (activeItem) {
			setCurrentPosition({
				parentId: activeItem.parentId,
				overId: activeId as string,
			});
		}

		document.body.style.setProperty("cursor", "grabbing");
	}

	function handleDragMove({ delta }: DragMoveEvent) {
		setOffsetLeft(delta.x);
	}

	function handleDragOver({ over }: DragOverEvent) {
		setOverId((over?.id as string) ?? null);
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		resetState();

		if (projected && over) {
			const { depth, parentId } = projected;
			const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(items)));
			const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
			const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
			const activeTreeItem = clonedItems[activeIndex];

			clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

			const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
			const newItems = buildTree(sortedItems);

			setItems(newItems);
		}
	}

	function handleDragCancel() {
		resetState();
	}

	function resetState() {
		setOverId(null);
		setActiveId(null);
		setOffsetLeft(0);
		setCurrentPosition(null);

		document.body.style.setProperty("cursor", "");
	}

	function handleRemove(id: string) {
		setItems((items) => removeItem(items, id));
	}

	function handleCollapse(id: string) {
		setItems((items) =>
			setProperty(items, id, "collapsed", (value) => {
				return !value;
			})
		);
	}

	function getMovementAnnouncement(eventName: string, activeId: string, overId?: string) {
		if (overId && projected) {
			if (eventName !== "onDragEnd") {
				if (
					currentPosition &&
					projected.parentId === currentPosition.parentId &&
					overId === currentPosition.overId
				) {
					return;
				} else {
					setCurrentPosition({
						parentId: projected.parentId,
						overId,
					});
				}
			}

			const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(items)));
			const overIndex = clonedItems.findIndex(({ id }) => id === overId);
			const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
			const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

			const previousItem = sortedItems[overIndex - 1];

			let announcement;
			const movedVerb = eventName === "onDragEnd" ? "dropped" : "moved";
			const nestedVerb = eventName === "onDragEnd" ? "dropped" : "nested";

			if (!previousItem) {
				const nextItem = sortedItems[overIndex + 1];
				announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`;
			} else {
				if (projected.depth > previousItem.depth) {
					announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
				} else {
					let previousSibling: FlattenedItem | undefined = previousItem;
					while (previousSibling && projected.depth < previousSibling.depth) {
						const parentId: string | null = previousSibling.parentId;
						previousSibling = sortedItems.find(({ id }) => id === parentId);
					}

					if (previousSibling) {
						announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
					}
				}
			}

			return announcement;
		}

		return;
	}
}

const adjustTranslate: Modifier = ({ transform }) => {
	return {
		...transform,
		y: transform.y - 25,
	};
};
