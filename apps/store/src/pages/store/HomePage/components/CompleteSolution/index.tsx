import { Package, List, Clock, Truck, RefreshCw } from "lucide-react";

const features = [
    {
        icon: Package,
        text: "כל המוצרים והמחירים באתר אחד",
    },
    {
        icon: List,
        text: "קטגוריות ברורות לגלישה נוחה",
    },
    {
        icon: Clock,
        text: "הזמנה מהירה ופשוטה",
    },
    {
        icon: Truck,
        text: "משלוח אמין למשרד",
    },
    {
        icon: RefreshCw,
        text: "מתאים להזמנות קבועות למשרד",
    },
];

const CompleteSolution = () => {
	return (
		<section className="py-20 lg:py-28 bg-background">
			<div className="container mx-auto px-4">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
						פתרון מלא למשרד – במקום אחד
					</h2>
					<p className="text-lg text-muted-foreground mb-14 max-w-2xl mx-auto">
						בלסי סטור מחליף מספר ספקים ומפשט את הרכש היומיומי במשרד.
					</p>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{features.map((feature, index) => (
							<div
								key={index}
								className="flex items-center gap-4 p-5 bg-section-alt rounded-xl shadow-card hover:shadow-card-hover transition-shadow border border-transparent"
							>
								<div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
									<feature.icon className="w-5 h-5 text-primary" />
								</div>
								<p className="text-foreground text-right font-medium text-[15px]">
									{feature.text}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default CompleteSolution;
