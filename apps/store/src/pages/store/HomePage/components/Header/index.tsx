import { Button } from "@heroui/react";
import { ShoppingCart, Phone } from "lucide-react";

interface HeaderProps {
	onContact: () => void;
}

const Header = ({ onContact }: HeaderProps) => {
	return (
		<header className="sticky top-0 z-50 bg-hero/95 text-hero-foreground backdrop-blur-sm border-b border-hero-foreground/5 shadow-[0_1px_0_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					<div className="font-bold text-xl tracking-tight">בלסי סטור</div>
					<div className="flex items-center gap-2">
						<Button
							onPress={onContact}
							variant="flat"
							size="sm"
							className="hidden sm:inline-flex text-hero-foreground bg-hero-foreground/10 hover:bg-hero-foreground/15"
						>
							<Phone className="w-4 h-4 ml-2" />
							צור קשר
						</Button>
						<Button isIconOnly size="sm" variant="flat" className="bg-hero-foreground/10 hover:bg-hero-foreground/15">
							<ShoppingCart className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
