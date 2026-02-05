import { ShoppingCart, Mail } from "lucide-react";
import { Button } from "@heroui/react";

interface OrderingOptionsProps {
    onContact: () => void;
}

const OrderingOptions = ({ onContact }: OrderingOptionsProps) => {
	return (
		<section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
			<div className="container mx-auto px-4 relative">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-5 tracking-tight">
						הזמינו באונליין או עבדו איתנו כספק קבוע
					</h2>
					<p className="text-primary-foreground/90 mb-2 text-lg">
						משרדים יכולים להזמין ישירות דרך החנות האונליין עם מחירים שקופים.
					</p>
					<p className="text-primary-foreground/90 mb-10 text-lg">
						או לפנות אלינו להסדרי ספק קבוע עם שירות אישי.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							color="primary"
							variant="flat"
							size="lg"
							onPress={onContact}
							className="text-base px-8 py-6 font-semibold bg-white text-primary hover:bg-white/95"
						>
							<Mail className="w-5 h-5 ml-2 shrink-0" />
							צור קשר – ספק קבוע למשרד
						</Button>
						<Button
							variant="bordered"
							size="lg"
							className="text-base px-8 py-6 border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
						>
							<a href="#store" className="flex items-center gap-2">
								<ShoppingCart className="w-5 h-5" />
								כניסה לחנות והזמנה
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default OrderingOptions;
