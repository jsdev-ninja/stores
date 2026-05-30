import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppSelector } from "src/infra";

interface HeaderProps {
	/** Opens the mobile sidebar drawer (hamburger, shown only below lg). */
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const storeName = useAppSelector((state) => state.store.data?.name);

	return (
		<header className="sticky top-0 z-30 flex items-center justify-between gap-4 h-16 px-4 lg:px-8 bg-[var(--surface)] border-b border-[var(--border)]">
			{/* Start (RTL: right) — hamburger + title */}
			<div className="flex items-center gap-3">
				<Button
					isIconOnly
					variant="ghost"
					size="sm"
					className="lg:hidden"
					onPress={onMenuClick}
					aria-label="פתיחת תפריט"
				>
					<Icon icon="lucide:menu" width={20} height={20} />
				</Button>
				<h1 className="text-lg lg:text-xl font-extrabold tracking-tight text-[var(--foreground)]">
					{storeName ?? "לוח ניהול"}
				</h1>
			</div>

			{/* End (RTL: left) — search + actions */}
			<div className="flex items-center gap-2">
				<div className="relative hidden md:flex items-center">
					<Icon
						icon="lucide:search"
						className="absolute start-2 text-default-400 pointer-events-none"
						width={16}
						height={16}
					/>
					<Input
						className="ps-7 text-sm w-56"
						placeholder="חיפוש..."
						type="search"
						aria-label="חיפוש"
					/>
				</div>
				<Button isIconOnly variant="ghost" size="sm" aria-label="התראות">
					<Icon icon="lucide:bell" width={20} height={20} />
				</Button>
				<Button isIconOnly variant="ghost" size="sm" aria-label="פרופיל">
					<Icon icon="lucide:user" width={20} height={20} />
				</Button>
			</div>
		</header>
	);
}
