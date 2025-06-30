import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { WebsiteLogo } from "src/widgets/WebsiteLogo";
// import { ThemeSwitcher } from "./theme-switcher";
// import { DirectionSwitcher } from "./direction-switcher";

interface HeaderProps {
	toggleMenu: () => void;
}

export function Header({ toggleMenu }: HeaderProps) {
	return (
		<header className="flex items-center justify-between px-4 py-3 bg-content1 border-b border-default-200 shadow-sm h-[60px]">
			<div className="flex items-center">
				<Button
					isIconOnly
					variant="light"
					size="sm"
					onPress={toggleMenu}
					aria-label="Toggle Menu"
					className="me-2"
				>
					<Icon icon="lucide:menu" width={20} height={20} />
				</Button>
				<div className="flex items-center">
					<div className="size-6 mx-2">
						<WebsiteLogo />
					</div>
					<span className="font-bold text-lg hidden sm:inline">Dashboard</span>
				</div>
			</div>

			<div className="hidden md:flex items-center ms-8 flex-1 max-w-md">
				<Input
					classNames={{
						base: "max-w-full",
						inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200",
					}}
					placeholder="Search..."
					startContent={
						<Icon icon="lucide:search" className="text-default-400" width={16} height={16} />
					}
					type="search"
					variant="bordered"
					size="sm"
				/>
			</div>

			<div className="flex items-center gap-2">
				{/* <DirectionSwitcher /> */}
				{/* <ThemeSwitcher /> */}
				<Button
					isIconOnly
					variant="light"
					size="sm"
					className="hidden sm:flex"
					aria-label="Notifications"
				>
					<Icon icon="lucide:bell" width={20} height={20} />
				</Button>
				<Button
					isIconOnly
					variant="light"
					size="sm"
					className="hidden sm:flex"
					aria-label="Settings"
				>
					<Icon icon="lucide:settings" width={20} height={20} />
				</Button>
				<Button isIconOnly variant="light" size="sm" className="ms-2" aria-label="User Profile">
					<Icon icon="lucide:user" width={20} height={20} />
				</Button>
			</div>
		</header>
	);
}
