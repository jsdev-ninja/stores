import { Button } from "src/components/button";
import { Link, TLinkTo, navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { WebsiteLogo } from "../WebsiteLogo";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useStore } from "src/domains/Store";

export function AppBar() {
	const { t } = useTranslation(["common"]);

	const appApi = useAppApi();

	const store = useStore();

	const user = useAppSelector((state) => state.user.user);

	const navLinks: { name: string; to: TLinkTo }[] = [];

	if (!user?.isAnonymous) {
		navLinks.push({
			name: t("navLinks.saved"),
			to: "store.favoritesProducts",
		});
		navLinks.push({
			name: t("navLinks.discounts"),
			to: "store.discounts",
		});
	}

	const dropdownItems = [
		{
			key: "profile",
			label: t("profile"),
			action: () =>
				navigate({
					to: "store.profile",
				}),
		},
		{
			key: "favorites",
			label: t("favorites"),
			action: () =>
				navigate({
					to: "store.favoritesProducts",
				}),
		},
		{
			key: "discounts",
			label: t("discounts"),
			action: () =>
				navigate({
					to: "store.discounts",
				}),
		},
		{
			key: "orders",
			label: t("orders"),
			action: () =>
				navigate({
					to: "store.orders",
				}),
		},
		{
			key: "logout",
			label: t("logout"),
			action: () => appApi.system.auth.logout(),
		},
	];

	if (user?.admin) {
		dropdownItems.unshift({
			key: "admin",
			label: t("admin"),
			action: () =>
				navigate({
					to: "admin",
				}),
		});
	}

	const text = user && !user.isAnonymous ? t("logout") : t("login");

	const onClick =
		user && !user.isAnonymous
			? () => FirebaseApi.auth.logout()
			: () => modalApi.openModal("authModal");

	return (
		<Navbar isBordered className="">
			<NavbarBrand>
				<div className="size-11">
					<WebsiteLogo />
				</div>
				<p className="font-bold text-inherit mx-2">{store?.name}</p>
			</NavbarBrand>
			<NavbarContent className="hidden md:flex gap-4" justify="center">
				{navLinks.map((link) => {
					return (
						<NavbarItem key={link.name}>
							<Link params={undefined as any} color="foreground" to={link.to}>
								{link.name}
							</Link>
						</NavbarItem>
					);
				})}
			</NavbarContent>
			<NavbarContent justify="end">
				<NavbarItem>
					{!!user && !user.isAnonymous ? (
						<Dropdown>
							<DropdownTrigger>
								<div className="">
									<Icon name="userCircle" size="lg" />
								</div>
							</DropdownTrigger>
							<DropdownMenu
								onAction={(key) => {
									const item = dropdownItems.find((item) => item.key === key);
									item?.action();
								}}
								items={dropdownItems}
							>
								{(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
							</DropdownMenu>
						</Dropdown>
					) : (
						<Button size="sm" onClick={onClick}>
							{text}
						</Button>
					)}
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
