import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { forwardRef, useState } from "react";
import { CategoryItem } from "./CategoryItem";

export function CategoriesTree() {
	const [items, setItems] = useState([1, 2, 3]);
	const [activeId, setActiveId] = useState(null);
	console.log("activeId", activeId);

	function handleDragEnd(event: any) {
		console.log(event);

		const { active, over } = event;

		if (active.id !== over.id) {
			setItems((items) => {
				const oldIndex = items.indexOf(active.id);
				const newIndex = items.indexOf(over.id);

				return arrayMove(items, oldIndex, newIndex);
			});
		}
	}
	function handleDragStart(event: any) {
		const { active } = event;

		setActiveId(active.id);
	}
	return (
		<DndContext
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			collisionDetection={closestCenter}
		>
			<SortableContext items={items}>
				{items.map((id) => (
					<CategoryItem key={id} id={id} />
				))}
			</SortableContext>
			{/* <DragOverlay>{activeId ? <OverLayItem id={activeId} /> : null}</DragOverlay> */}
		</DndContext>
	);
}

export const OverLayItem = forwardRef<any, any>((props, ref) => {
	return (
		<div ref={ref} className="border">
			{props.id}
		</div>
	);
});
