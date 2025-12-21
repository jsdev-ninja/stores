import React from "react";
import { Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Link, routes, useLocation } from "src/navigation";
import { RouteKeys } from "src/lib/router";

interface SidebarItemProps {
	icon: string;
	label: string;
	to: RouteKeys<typeof routes>;
	isCollapsed?: boolean;
}

interface SidebarCategoryProps {
	titleKey: string;
	items: Array<{
		name: string;
		path: RouteKeys<typeof routes>;
		icon: string;
		params?: any;
	}>;
	isCollapsed: boolean;
}

const sidebarCategories = [
	{
		titleKey: "dashboard",
		items: [
			{
				name: "dashboard",
				path: "admin" as RouteKeys<typeof routes>,
				icon: "lucide:layout-dashboard",
			},
		],
	},
	{
		titleKey: "manageStore",
		items: [
			{
				name: "products",
				path: "admin.products" as RouteKeys<typeof routes>,
				icon: "lucide:package",
			},
			{
				name: "categories",
				path: "admin.categories" as RouteKeys<typeof routes>,
				icon: "lucide:folder-tree",
			},
			{
				name: "discounts",
				path: "admin.discounts" as RouteKeys<typeof routes>,
				icon: "lucide:percent",
			},
			{
				name: "inventoryCertificate",
				path: "admin.inventoryCertificate" as RouteKeys<typeof routes>,
				icon: "lucide:file-check",
			},
		],
	},
	{
		titleKey: "manageUsers",
		items: [
			{
				name: "users",
				path: "admin.users" as RouteKeys<typeof routes>,
				icon: "lucide:users",
			},
			{
				name: "organizations",
				path: "admin.organizations" as RouteKeys<typeof routes>,
				icon: "lucide:building-2",
			},
			{
				name: "organizationGroups",
				path: "admin.organizationGroups" as RouteKeys<typeof routes>,
				icon: "lucide:folder-tree",
			},
		],
	},
	{
		titleKey: "manageOrders",
		items: [
			{
				name: "orders",
				path: "admin.orders" as RouteKeys<typeof routes>,
				icon: "lucide:shopping-cart",
			},
		],
	},
	{
		titleKey: "billing",
		items: [
			{
				name: "invoices",
				path: "admin.invoices" as RouteKeys<typeof routes>,
				icon: "lucide:receipt",
			},
		],
	},
	{
		titleKey: "adminSettings",
		items: [
			{
				name: "settings",
				path: "admin.settings" as RouteKeys<typeof routes>,
				icon: "lucide:settings",
			},
		],
	},
];

const SidebarItem: React.FC<SidebarItemProps> = ({
	icon,
	label,
	to,
	isCollapsed = false,
}) => {
	const [location] = useLocation();
	const direction = "rtl"; // todo
	const isActive = location.pathname === to;

	return (
		<Tooltip
			content={label}
			placement={direction === "rtl" ? "left" : "right"}
			delay={300}
			isDisabled={!isCollapsed && window.innerWidth >= 1024}
		>
			<Link
				to={to}
				params={{}}
				className={`flex ${
					isCollapsed ? "justify-center" : "justify-start"
				} items-center mb-1 w-full py-2 px-3 rounded-md transition-colors ${
					isActive
						? "sidebar-item-active text-primary"
						: "text-foreground-600 hover:bg-default-100"
				}`}
			>
				<div className="relative">
					<Icon icon={icon} width={20} height={20} />
				</div>
				{!isCollapsed && <span className="ms-2">{label}</span>}
			</Link>
		</Tooltip>
	);
};

const SidebarCategory: React.FC<SidebarCategoryProps> = ({ titleKey, items, isCollapsed }) => {
	const { t } = useTranslation(["common"]);

	if (isCollapsed) {
		// When collapsed, show items without category headers
		return (
			<>
				{items.map((item) => (
					<SidebarItem
						key={item.path}
						icon={item.icon}
						label={t(item.name as any)}
						to={item.path}
						isCollapsed={isCollapsed}
					/>
				))}
			</>
		);
	}

	return (
		<div className="mb-6">
			<div className="px-3 mb-2">
				<h3 className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">
					{t(titleKey as any)}
				</h3>
			</div>
			<div className="space-y-1">
				{items.map((item) => (
					<SidebarItem
						key={item.path}
						icon={item.icon}
						label={t(item.name as any)}
						to={item.path}
						isCollapsed={isCollapsed}
					/>
				))}
			</div>
		</div>
	);
};

interface SidebarProps {
	isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
	const direction = "rtl"; //todo
	const isCollapsed = !isOpen && window.innerWidth >= 1024;

	return (
		<aside
			className={`fixed lg:fixed bg-content1 border-inline-end border-default-200 sidebar-transition overflow-y-auto z-40 h-[calc(100vh-60px)] ${
				isOpen
					? "w-64 translate-x-0"
					: `w-0 lg:w-16 ${
							direction === "rtl"
								? "translate-x-full lg:translate-x-0"
								: "-translate-x-full lg:translate-x-0"
					  }`
			}`}
			style={{
				[direction === "rtl" ? "right" : "left"]: 0,
				boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
			}}
		>
			<div className={`p-4 ${!isOpen && "lg:px-2 lg:py-4"}`}>
				<div className="flex flex-col">
					{sidebarCategories.map((category, index) => (
						<SidebarCategory
							key={index}
							titleKey={category.titleKey}
							items={category.items}
							isCollapsed={isCollapsed}
						/>
					))}
				</div>
			</div>
		</aside>
	);
}
