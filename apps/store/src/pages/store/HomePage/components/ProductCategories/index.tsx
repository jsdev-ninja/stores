import { Milk, Apple, SprayCan, Bath } from "lucide-react";

const categories = [
    {
        icon: Milk,
        title: "מוצרי חלב",
        description: "מוצרי חלב איכותיים לשימוש יומיומי במשרד",
    },
    {
        icon: Apple,
        title: "פירות וירקות",
        description: "תוצרת טרייה למטבחון המשרד, לעובדים ולאירוח",
    },
    {
        icon: SprayCan,
        title: "מוצרי ניקיון",
        description: "חומרי ניקוי, אביזרים ומוצרי נייר למשרדים",
    },
    {
        icon: Bath,
        title: "מוצרי היגיינה",
        description: "סבון, נייר טואלט, מגבות נייר ומתכלים",
    },
];

const ProductCategories = () => {
	return (
		<section className="py-20 lg:py-28 bg-section-alt">
			<div className="container mx-auto px-4">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
						קטגוריות המוצרים שלנו
					</h2>
					<p className="text-lg text-muted-foreground">
						כל מה שהמשרד שלכם צריך, מסודר להזמנה קלה.
					</p>
				</div>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
					{categories.map((category, index) => (
						<div
							key={index}
							className="bg-background p-6 rounded-2xl text-center shadow-card hover:shadow-card-hover transition-shadow border-0"
						>
							<div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
								<category.icon className="w-7 h-7 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground mb-2">
								{category.title}
							</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{category.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ProductCategories;
