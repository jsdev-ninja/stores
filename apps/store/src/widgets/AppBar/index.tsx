import { Button } from "src/components/button";
import { TLinkTo, navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";
import { WebsiteLogo } from "../WebsiteLogo";

import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
} from "@nextui-org/react";
import { useState } from "react";
import { Link } from "src/ui";

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";

export function AppBar() {
	const { t } = useTranslation();

	const appApi = useAppApi();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const user = useAppSelector((state) => state.user.user);

	const navLinks: { name: string; to: TLinkTo }[] = [];

	if (!user?.isAnonymous) {
		navLinks.push({
			name: t("navLinks.saved"),
			to: "store.favoritesProducts",
		});
	}

	const dropdownItems = [
		{
			key: "profile",
			label: "profile",
			action: () =>
				navigate({
					to: "store.profile",
				}),
		},
		{
			key: "favorites",
			label: "favorites",
			action: () =>
				navigate({
					to: "store.favoritesProducts",
				}),
		},
		{
			key: "orders",
			label: "orders",
			action: () =>
				navigate({
					to: "store.orders",
				}),
		},
		{
			key: "logout",
			label: "logout",
			action: () => appApi.system.auth.logout(),
		},
	];

	if (user?.admin) {
		dropdownItems.unshift({
			key: "admin",
			label: "admin",
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

	function navigateToProfile() {
		navigate({
			to: "store.profile",
		});
	}

	return (
		<Navbar onMenuOpenChange={setIsMenuOpen} isBordered>
			<NavbarMenu>
				{navLinks.map((item, index) => (
					<NavbarMenuItem key={`${item}-${index}`}>
						<Link
							color={index === 2 ? "primary" : index === -1 ? "danger" : "foreground"}
							className="w-full"
							href="#"
							size="lg"
							to={item.to}
						>
							{item.name}
						</Link>
					</NavbarMenuItem>
				))}
			</NavbarMenu>
			<NavbarBrand>
				<div className="h-[40px] w-[80px]">
					<WebsiteLogo />
				</div>
				<p className="font-bold text-inherit">ACME</p>
			</NavbarBrand>
			<NavbarContent className="hidden sm:flex gap-4" justify="center">
				{navLinks.map((link) => {
					return (
						<NavbarItem key={link.name}>
							<Link color="foreground" to={link.to}>
								{link.name}
							</Link>
						</NavbarItem>
					);
				})}
			</NavbarContent>
			<NavbarContent justify="end">
				<NavbarMenuToggle
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					className="sm:hidden"
				/>
				<NavbarItem>
					{!!user && !user.isAnonymous ? (
						<Dropdown>
							<DropdownTrigger>
								<div className="">
									<Icon onClick={navigateToProfile} name="userCircle" size="lg" />
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
