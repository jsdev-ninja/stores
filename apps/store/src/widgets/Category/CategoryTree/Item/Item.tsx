import React, { CSSProperties, forwardRef, HTMLAttributes } from "react";
import classNames from "classnames";

import styles from "./style.module.css";
import styles2 from "./A.module.css";
import { AnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "src/components";
import { modalApi } from "src/infra/modals";
import { navigate } from "src/navigation";
export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

export interface AProps extends React.HTMLAttributes<HTMLButtonElement> {
	active?: {
		fill: string;
		background: string;
	};
	cursor?: CSSProperties["cursor"];
}

export const Action = forwardRef<HTMLButtonElement, AProps>(function Action(
	{ active, className, cursor, style, ...props },
	ref
) {
	return (
		<button
			ref={ref}
			{...props}
			className={classNames(styles2.Action, className)}
			tabIndex={0}
			style={
				{
					...style,
					cursor,
					"--fill": active?.fill,
					"--background": active?.background,
				} as CSSProperties
			}
		/>
	);
});

export function Remove(props: AProps) {
	return (
		<Action
			ref={undefined}
			{...props}
			active={{
				fill: "rgba(255, 70, 70, 0.95)",
				background: "rgba(255, 70, 70, 0.1)",
			}}
		>
			<svg width="8" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
				<path d="M2.99998 -0.000206962C2.7441 -0.000206962 2.48794 0.0972617 2.29294 0.292762L0.292945 2.29276C-0.0980552 2.68376 -0.0980552 3.31682 0.292945 3.70682L7.58591 10.9998L0.292945 18.2928C-0.0980552 18.6838 -0.0980552 19.3168 0.292945 19.7068L2.29294 21.7068C2.68394 22.0978 3.31701 22.0978 3.70701 21.7068L11 14.4139L18.2929 21.7068C18.6829 22.0978 19.317 22.0978 19.707 21.7068L21.707 19.7068C22.098 19.3158 22.098 18.6828 21.707 18.2928L14.414 10.9998L21.707 3.70682C22.098 3.31682 22.098 2.68276 21.707 2.29276L19.707 0.292762C19.316 -0.0982383 18.6829 -0.0982383 18.2929 0.292762L11 7.58573L3.70701 0.292762C3.51151 0.0972617 3.25585 -0.000206962 2.99998 -0.000206962Z" />
			</svg>
		</Action>
	);
}

export const Handle = forwardRef<HTMLButtonElement, AProps>((props, ref) => {
	return (
		<Action ref={ref} cursor="grab" data-cypress="draggable-handle" {...props}>
			<svg viewBox="0 0 20 20" width="12">
				<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
			</svg>
		</Action>
	);
});

export interface TreeItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
	childCount?: number;
	clone?: boolean;
	collapsed?: boolean;
	depth: number;
	disableInteraction?: boolean;
	disableSelection?: boolean;
	ghost?: boolean;
	handleProps?: any;
	indentationWidth: number;
	value: string;
	onCollapse?(): void;
	onRemove?(): void;
	wrapperRef?(node: HTMLLIElement): void;
	id: string;
	setCategories?: any;
}

export const TreeItem = ({
	id,
	depth,
	childCount,
	clone,
	indentationWidth,
	collapsed,
	onCollapse,
	onRemove,
	setCategories,
	value,
	...props
}: TreeItemProps) => {
	const {
		attributes,
		listeners,
		isDragging,
		isSorting,
		setDraggableNodeRef,
		setDroppableNodeRef,
		transform,
		transition,
	} = useSortable({
		id,
		animateLayoutChanges,
	});
	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<li
			className={classNames(
				styles.Wrapper,
				clone && styles.clone,
				isDragging && styles.ghost,
				styles.indicator,
				iOS && styles.disableSelection,
				isSorting && styles.disableInteraction
			)}
			ref={setDroppableNodeRef}
			style={
				{
					"--spacing": `${indentationWidth * depth}px`,
				} as React.CSSProperties
			}
			{...props}
		>
			<div className={styles.TreeItem} ref={setDraggableNodeRef} style={style}>
				<Handle {...attributes} {...listeners} />
				<span
					onClick={() => {
						navigate({
							to: "admin.productsByCategory",
							params: { categoryName: value },
						});
					}}
					className="mx-5 cursor-pointer"
				>
					{value}
				</span>
				<div className="flex items-center gap-5 ms-auto">
					<Icon
						size="sm"
						name="edit"
						onClick={() => {
							modalApi.openModal("categoryFormModal", {
								categoryId: id,
								onSave: setCategories,
							});
						}}
					/>
					{!clone && onRemove && <Remove onClick={onRemove} />}
					{onCollapse && (
						<Action
							ref={undefined}
							onClick={onCollapse}
							className={classNames({
								[styles2.collapsed]: collapsed,
							})}
						>
							{collapseIcon}
						</Action>
					)}
					{clone && childCount && childCount > 1 ? (
						<span className={styles.Count}>{childCount}</span>
					) : null}
				</div>
			</div>
		</li>
	);
};

export const collapseIcon = (
	<svg width="10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 41">
		<path d="M30.76 39.2402C31.885 40.3638 33.41 40.995 35 40.995C36.59 40.995 38.115 40.3638 39.24 39.2402L68.24 10.2402C69.2998 9.10284 69.8768 7.59846 69.8494 6.04406C69.822 4.48965 69.1923 3.00657 68.093 1.90726C66.9937 0.807959 65.5106 0.178263 63.9562 0.150837C62.4018 0.123411 60.8974 0.700397 59.76 1.76024L35 26.5102L10.24 1.76024C9.10259 0.700397 7.59822 0.123411 6.04381 0.150837C4.4894 0.178263 3.00632 0.807959 1.90702 1.90726C0.807714 3.00657 0.178019 4.48965 0.150593 6.04406C0.123167 7.59846 0.700153 9.10284 1.75999 10.2402L30.76 39.2402Z" />
	</svg>
);

const animateLayoutChanges: AnimateLayoutChanges = ({ isSorting, wasDragging }) =>
	isSorting || wasDragging ? false : true;
