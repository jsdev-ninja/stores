import React from "react";
import {
	Navbar,
	NavbarBrand,
	NavbarMenuToggle,
	NavbarMenuItem,
	NavbarMenu,
	NavbarContent,
	NavbarItem,
	Link,
	Button,
	Input,
} from "@nextui-org/react";
import AcmeLogo from "../../assets/logo.png";
import { Icon } from "src/shared";
import { useTranslation } from "react-i18next";

const items = [
	{
		key: "new",
		label: "New file",
	},
	{
		key: "copy",
		label: "Copy link",
	},
	{
		key: "edit",
		label: "Edit file",
	},
	{
		key: "delete",
		label: "Delete file",
	},
];

export function AppBar() {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

	const { t } = useTranslation();

	return (
		<Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
			<NavbarContent className="pr-3" justify="center">
				<NavbarBrand>
					<div className="h-[50px] w-[100px]">
						<img src={AcmeLogo} alt="" />
					</div>
				</NavbarBrand>
			</NavbarContent>
			<NavbarContent className="sm:hidden" justify="start">
				<NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
			</NavbarContent>
			<Input
				classNames={{
					base: "max-w-full h-10",
					input: "text-small",
					inputWrapper:
						"h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
				}}
				placeholder="Type to search..."
				size="sm"
				startContent={<Icon name="search" />}
				type="search"
			/>
			<NavbarContent justify="end">
				<NavbarItem>
					<Button color="warning" href="#" variant="flat">
						Login
					</Button>
				</NavbarItem>
			</NavbarContent>
			<NavbarMenu>
				{menuItems.map((item, index) => (
					<NavbarMenuItem key={`${item}-${index}`}>
						<Link
							className="w-full"
							color={
								index === 2
									? "warning"
									: index === menuItems.length - 1
									? "danger"
									: "foreground"
							}
							href="#"
							size="lg"
						>
							{item}
						</Link>
					</NavbarMenuItem>
				))}
			</NavbarMenu>
		</Navbar>
	);
}
