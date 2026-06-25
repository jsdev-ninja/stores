import { useLocation } from "react-router-dom";

type NavItem = {
	label: string;
	path: string;
};

const NAV_ITEMS: NavItem[] = [
	{ label: "Orders", path: "/orders" },
	{ label: "Products", path: "/products" },
	{ label: "Profiles", path: "/profiles" },
	{ label: "Audit", path: "/audit" },
];

export function useAppShell() {
	const location = useLocation();

	const isActive = (path: string) =>
		location.pathname === path || location.pathname.startsWith(path + "/");

	return { navItems: NAV_ITEMS, isActive };
}
