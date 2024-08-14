import classNames from "classnames";
import { HierarchicalMenuItem } from "instantsearch.js/es/connectors/hierarchical-menu/connectHierarchicalMenu";
import { RangeBoundaries } from "instantsearch.js/es/connectors/range/connectRange";
import { useHierarchicalMenu, useRange, useRefinementList } from "react-instantsearch";
import { Checkbox } from "src/components/Checkbox/Checkbox";
import { Slider } from "src/components/Slider/Slider";
import { TProduct } from "src/domains";
import { NestedKeys } from "src/shared/types";

function CategoryFilter() {
	const menu = useHierarchicalMenu({
		attributes: [
			"categories.lvl0",
			"categories.lvl1",
			"categories.lvl2",
			"categories.lvl3",
			"categories.lvl4",
		],
		showParentLevel: true,
		limit: 100,
	});

	return (
		<div className="flex flex-col gap-2">
			{menu.items.map((menuItem) => {
				return (
					<MenuItem
						onClick={(item) => {
							menu.refine(item.value);
						}}
						key={menuItem.value}
						item={menuItem}
					/>
				);
			})}
		</div>
	);
}

function MenuItem({
	item,
	onClick,
	depth = 0,
}: {
	item: HierarchicalMenuItem;
	onClick: (item: HierarchicalMenuItem) => void;
	depth?: number;
}) {
	return (
		<>
			<div
				style={{
					paddingInlineStart: depth * 16,
				}}
				onClick={() => onClick?.(item)}
				className={classNames("cursor-pointer", {
					"font-semibold text-primary-light": item.isRefined,
				})}
			>
				<span className="">{item.count}</span>
				{item.label}
			</div>
			{item.data &&
				item.data.map((item) => (
					<MenuItem depth={depth + 1} key={item.value} item={item} onClick={onClick} />
				))}
		</>
	);
}

function RangeFilter(props: { attribute: NestedKeys<TProduct> & string; label: string }) {
	const refinement = useRange({
		attribute: props.attribute,
		max: 1000,
		min: 0,
	});

	const {} = refinement;
	return (
		<div className="flex flex-col gap-2">
			<div className="font-semibold my-2">{props.label}</div>
			<Slider
				onChange={(change) => {
					refinement.refine(change.value as RangeBoundaries);
				}}
			/>
			{/* {items.map((item) => {
				return (
					<Checkbox
						onChange={() => refine(item.value)}
						value={item.isRefined}
						label={item.label}
						name={item.value}
					/>
				);
			})} */}
		</div>
	);
}

function RefinementFilter(props: { attribute: NestedKeys<TProduct> & string; label: string }) {
	const refinement = useRefinementList({
		attribute: props.attribute,
	});

	const { items, refine } = refinement;

	return (
		<div className="flex flex-col gap-2">
			<div className="font-semibold">{props.label}</div>
			{items.map((item) => {
				return (
					<Checkbox
						onChange={() => refine(item.value)}
						value={item.isRefined}
						label={item.label}
						name={item.value}
					/>
				);
			})}
		</div>
	);
}

export function ProductFilter() {
	return (
		<div className="p-4 flex flex-col gap-4">
			<CategoryFilter />
			<RangeFilter label="price" attribute="price" />
			<RefinementFilter attribute="brand" label="brand" />
			<RefinementFilter attribute="manufacturer" label="manufacturer" />
		</div>
	);
}
