import { Check } from "lucide-react";

const reasons = [
    "מחירים שקופים באונליין",
    "ספק אחד לכל צרכי המשרד",
    "הזמנה מהירה וחיסכון בזמן",
    "שירות אישי ללקוחות קבועים",
];

const WhyBlesi = () => {
	return (
		<section className="py-20 lg:py-28 bg-background">
			<div className="container mx-auto px-4">
				<div className="max-w-2xl mx-auto text-center">
					<h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-12 tracking-tight">
						למה משרדים עובדים עם בלסי סטור
					</h2>
					<div className="space-y-3">
						{reasons.map((reason, index) => (
							<div
								key={index}
								className="flex items-center gap-4 p-4 bg-section-alt rounded-xl shadow-card border border-transparent"
							>
								<div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
									<Check className="w-5 h-5 text-primary-foreground" />
								</div>
								<p className="text-foreground text-right font-medium text-base">
									{reason}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default WhyBlesi;
