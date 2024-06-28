import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function CategoryItem({ id }: any) {
	const sortable = useSortable({ id });
	// console.log(sortable.transform, sortable.transition);

	const style = {
		transform: CSS.Transform.toString(sortable.transform),
		transition: sortable.transition,
	};

	return (
		<div
			ref={sortable.setNodeRef}
			{...sortable.attributes}
			style={style}
			{...sortable.listeners}
			className="border p-2"
		>
			{id}
		</div>
	);
}
