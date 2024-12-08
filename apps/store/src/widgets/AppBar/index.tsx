import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";
import { Dropdown } from "src/components/Dropdown";
import { useAppApi } from "src/appApi";
import { WebsiteLogo } from "../WebsiteLogo";

import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	Link,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
} from "@nextui-org/react";
import { useState } from "react";

export function AppBar() {
	const { t } = useTranslation();

	const appApi = useAppApi();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const menuItems = [
		"Profile",
		"Dashboard",
		"Activity",
		"Analytics",
		"System",
		"Deployments",
		"My Settings",
		"Team Settings",
		"Help & Feedback",
		"Log Out",
	];

	const navLinks: [{ name: string; to: string }] = [
		{
			name: "favorites",
			to: "store.favoriteProducts",
		},
	] as const;

	const user = useAppSelector((state) => state.user.user);

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
		<Navbar onMenuOpenChange={setIsMenuOpen}>
			<NavbarMenu>
				{navLinks.map((item, index) => (
					<NavbarMenuItem key={`${item}-${index}`}>
						<Link
							color={
								index === 2
									? "primary"
									: index === menuItems.length - 1
									? "danger"
									: "foreground"
							}
							className="w-full"
							href="#"
							size="lg"
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
						<NavbarItem>
							<Link color="foreground" href={link.to}>
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
							<Dropdown.Trigger>
								<div className="">
									<Icon onClick={navigateToProfile} name="userCircle" size="lg" />
								</div>
							</Dropdown.Trigger>
							<Dropdown.Content>
								{!!user.admin && (
									<Dropdown.Item
										onSelect={() =>
											navigate({
												to: "admin",
											})
										}
									>
										admin
									</Dropdown.Item>
								)}
								<Dropdown.Item
									onSelect={() =>
										navigate({
											to: "store.profile",
										})
									}
								>
									profile
								</Dropdown.Item>
								<Dropdown.Item
									onSelect={() =>
										navigate({
											to: "store.favoritesProducts",
										})
									}
								>
									favorites
								</Dropdown.Item>
								<Dropdown.Item
									onSelect={() =>
										navigate({
											to: "store.orders",
										})
									}
								>
									orders
								</Dropdown.Item>
								<Dropdown.Item onSelect={appApi.system.auth.logout}>logout</Dropdown.Item>
							</Dropdown.Content>
						</Dropdown>
					) : (
						<Button onClick={onClick}>{text}</Button>
					)}
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
