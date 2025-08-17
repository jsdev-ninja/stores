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
	hasNotification?: boolean;
	isCollapsed?: boolean;
}

const items: Array<{ 
	name: string; 
	path: RouteKeys<typeof routes>; 
	icon: string;
	params?: any 
}> = [
	{
		name: "dashboard",
		path: "admin",
		icon: "lucide:layout-dashboard",
	},
	{
		name: "users",
		path: "admin.users",
		icon: "lucide:users",
	},
	{
		name: "products",
		path: "admin.products",
		icon: "lucide:package",
	},
	{ 
		name: "categories", 
		path: "admin.categories",
		icon: "lucide:folder-tree",
	},
	{ 
		name: "discounts", 
		path: "admin.discounts",
		icon: "lucide:percent",
	},
	{ 
		name: "orders", 
		path: "admin.orders",
		icon: "lucide:shopping-cart",
	},
	{ 
		name: "settings", 
		path: "admin.settings",
		icon: "lucide:settings",
	},
] as const;

const SidebarItem: React.FC<SidebarItemProps> = ({
	icon,
	label,
	to,
	hasNotification = false,
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
					{hasNotification && (
						<span className="absolute -top-1 end-[-4px] w-2 h-2 bg-danger rounded-full"></span>
					)}
				</div>
				{!isCollapsed && <span className="ms-2">{label}</span>}
			</Link>
		</Tooltip>
	);
};

interface SidebarProps {
	isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
	const { t } = useTranslation(["common"]);
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
					{items.map((item) => {
						return (
							<SidebarItem
								key={item.path}
								icon={item.icon}
								label={t(item.name as any)}
								to={item.path}
								isCollapsed={isCollapsed}
							/>
						);
					})}
				</div>
			</div>
		</aside>
	);
}
