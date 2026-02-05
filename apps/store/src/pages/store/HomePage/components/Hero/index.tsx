import heroImage from "./hero-office.jpg";
import { Button } from "@heroui/react";
import { ShoppingCart, Phone } from "lucide-react";

interface HeroProps {
	onContact: () => void;
}

const Hero = ({ onContact }: HeroProps) => {
	return (
		<section className="relative bg-hero text-hero-foreground">
			<div className="container mx-auto px-4 py-20 lg:py-28">
				<div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
					<div className="max-w-xl order-2 lg:order-1">
						<h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6 tracking-tight">
							ספק אונליין למשרדים בלבד
						</h1>
						<p className="text-lg lg:text-xl text-hero-muted mb-4 leading-relaxed">
							כל מוצרי המזון, הניקיון וההיגיינה – במחירים שקופים והזמנה פשוטה באונליין.
						</p>
						<p className="text-base text-hero-muted mb-10 leading-relaxed">
							<span className="text-hero-foreground font-semibold">בנוי למשרדים. לא ללקוחות פרטיים.</span>
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<Button
								color="primary"
								size="lg"
								onPress={onContact}
								className="text-base px-8 py-6 font-semibold shadow-md hover:shadow-lg transition-shadow"
							>
								<Phone className="w-5 h-5 ml-2 shrink-0" />
								צור קשר לספק קבוע
							</Button>
							<Button
								variant="bordered"
								size="lg"
								className="text-base px-8 py-6 border-2 border-default-300 hover:bg-default-100"
							>
								<a href="#store" className="flex items-center gap-2">
									<ShoppingCart className="w-5 h-5" />
									כניסה לחנות האונליין
								</a>
							</Button>
						</div>
					</div>
					<div className="relative hidden lg:block order-1 lg:order-2">
						<div className="rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
							<img
								src={heroImage}
								alt="מטבחון משרדי מודרני עם מוצרים מסודרים"
								className="w-full h-auto object-cover"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
