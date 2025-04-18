import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
	DndContext,
	closestCenter,
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
import { TreeItem } from "./Item/Item";
import { buildTree, flattenTree, removeChildrenOf } from "./utils";
import { TCategory } from "@jsdev_ninja/core";

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

export type TreeItems = TreeItem[];

function getDragDepth(offset: number, indentationWidth: number) {
	return Math.round(offset / indentationWidth);
}

export function getProjection(
	items: TCategory[],
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

	const projectedDepth = (activeItem as any).depth + dragDepth;
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

		if (depth === (previousItem as any).depth) {
			return previousItem.parentId;
		}

		if (depth > (previousItem as any).depth) {
			return previousItem.id;
		}

		const newParent = newItems
			.slice(0, overItemIndex)
			.reverse()
			.find((item) => (item as any).depth === depth)?.parentId;

		return newParent ?? null;
	}
}

function getMaxDepth({ previousItem }: { previousItem: any }) {
	let maxDepth = 4;

	if (previousItem) {
		return previousItem.depth + 1 <= maxDepth ? previousItem.depth + 1 : maxDepth;
	}

	return 0;
}

function getMinDepth({ nextItem }: { nextItem: any }) {
	if (nextItem) {
		return nextItem.depth;
	}

	return 0;
}

function findItem(items: TCategory[], itemId: string) {
	return items.find(({ id }) => id === itemId);
}

function removeItem(items: TreeItems, id: string) {
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

export interface TreeItem {
	id: string;
	children: TreeItem[];
	collapsed?: boolean;
}

export interface FlattenedItem extends TreeItem {
	parentId: string;
	depth: number;
	index: number;
}

export type SensorContext = MutableRefObject<{
	items: TCategory[];
	offset: number;
}>;

const measuring = {
	droppable: {
		strategy: MeasuringStrategy.Always,
	},
};

const dropAnimationConfig: DropAnimation = {
	keyframes({ transform }) {
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
	indentationWidth?: number;
	categories: TCategory[];
	setCategories: (categories: TCategory[]) => void;
}

export interface Item extends TCategory {
	depth: number;
	// index: number;
}

export interface TreeItem extends TCategory {
	children: TreeItem[];
}

export function CategoryTree({ indentationWidth = 50, categories = [], setCategories }: Props) {
	const [items, setItems] = useState<TCategory[]>(categories);

	useEffect(() => {
		setItems(categories);
	}, [categories]);

	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [offsetLeft, setOffsetLeft] = useState(0);

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
			? getProjection(flattenedItems as any, activeId, overId, offsetLeft, indentationWidth)
			: null;

	function countChildren(item: TCategory): number {
		const childrenItems = items.filter((i) => i.parentId === item.id);
		return childrenItems.length;
	}
	function getChildCount(items: TCategory[], id: string) {
		const item = findItem(items, id);

		return item ? countChildren(item) : 0;
	}

	function setProperty<T extends keyof TreeItem>(
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

	const sensors = useSensors(useSensor(PointerSensor));

	const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
	const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

	return (
		<div className="flex-grow">
			<DndContext
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
					{flattenedItems.map(({ id, locales, depth, children, collapsed }) => {
						const name = locales[0].value;

						return (
							<TreeItem
								key={id}
								id={id}
								value={name}
								depth={id === activeId && projected ? projected.depth : depth}
								indentationWidth={indentationWidth}
								collapsed={Boolean(collapsed && children.length)}
								onCollapse={children.length ? () => handleCollapse(id) : undefined}
								onRemove={() => handleRemove(id)}
								setCategories={setCategories}
							/>
						);
					})}
					{createPortal(
						<DragOverlay dropAnimation={dropAnimationConfig} modifiers={[adjustTranslate]}>
							{activeId && activeItem ? (
								<TreeItem
									id={activeId}
									depth={activeItem.depth}
									clone
									childCount={getChildCount(items, activeId) + 1}
									value={(activeItem as any)?.locales[0].value}
									indentationWidth={indentationWidth}
								/>
							) : null}
						</DragOverlay>,
						document.body
					)}
				</SortableContext>
			</DndContext>
		</div>
	);

	function handleDragStart({ active }: DragStartEvent) {
		setActiveId(active.id as string);
		setOverId(active.id as string);

		document.body.style.setProperty("cursor", "grabbing");
	}

	function handleDragMove({ delta }: DragMoveEvent) {
		setOffsetLeft(-delta.x);
	}

	function handleDragOver({ over }: DragOverEvent) {
		setOverId((over?.id as string) ?? null);
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		resetState();

		if (projected && over) {
			const { depth, parentId } = projected;

			const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(items as any)));
			const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
			const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
			const activeTreeItem = clonedItems[activeIndex];

			clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId } as any;

			const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
			const newItems = buildTree(sortedItems);

			setItems(newItems as any);
			setCategories(newItems as any);
		}
	}

	function handleDragCancel() {
		resetState();
	}

	function resetState() {
		setOverId(null);
		setActiveId(null);
		setOffsetLeft(0);

		document.body.style.setProperty("cursor", "");
	}

	function handleRemove(id: string) {
		const newItems = removeItem(items, id);
		setCategories(newItems);
	}

	function handleCollapse(id: string) {
		setItems((items) =>
			setProperty(items, id, "collapsed", (value) => {
				return !value;
			})
		);
	}
}

const adjustTranslate: Modifier = ({ transform }) => {
	return {
		...transform,
		y: transform.y - 25,
	};
};
