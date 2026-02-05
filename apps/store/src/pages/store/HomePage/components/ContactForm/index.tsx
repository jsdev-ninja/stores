import { useState } from "react";
import { Clock, Shield, Send } from "lucide-react";
import { Button, Input, Textarea } from "@heroui/react";

interface ContactFormProps {
    variant?: "light" | "dark";
    title?: string;
    subtitle?: string;
}

const ContactForm = ({
    variant = "light",
    title = "הפכו ללקוח משרד קבוע",
    subtitle = "מלאו את הטופס ונחזור אליכם לשיחה על צרכי המשרד שלכם."
}: ContactFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        // toast.success("תודה! נחזור אליכם בהקדם.");
        setFormData({ name: "", email: "", company: "", phone: "", message: "" });
        setIsSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const isDark = variant === "dark";

	return (
		<section className={`py-20 lg:py-28 ${isDark ? "bg-hero" : "bg-background"}`} id="contact">
			<div className="container mx-auto px-4">
				<div className="max-w-2xl mx-auto">
					<div className="text-center mb-12">
						<h2 className={`text-3xl lg:text-4xl font-bold mb-4 tracking-tight ${isDark ? "text-hero-foreground" : "text-foreground"}`}>
							{title}
						</h2>
						<p className={`text-lg ${isDark ? "text-hero-muted" : "text-muted-foreground"}`}>
							{subtitle}
						</p>
					</div>
					<div className="rounded-2xl p-6 sm:p-8 bg-section-alt shadow-card border border-transparent">
					<form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <Input
                                    name="name"
                                    placeholder="שם מלא"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className={isDark ? "bg-hero-foreground/10 border-hero-muted/30 text-hero-foreground placeholder:text-hero-muted" : ""}
                                />
                            </div>
                            <div>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="אימייל עבודה"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={isDark ? "bg-hero-foreground/10 border-hero-muted/30 text-hero-foreground placeholder:text-hero-muted" : ""}
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <Input
                                    name="company"
                                    placeholder="חברה / ארגון"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required
                                    className={isDark ? "bg-hero-foreground/10 border-hero-muted/30 text-hero-foreground placeholder:text-hero-muted" : ""}
                                />
                            </div>
                            <div>
                                <Input
                                    name="phone"
                                    type="tel"
                                    placeholder="מספר טלפון"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={isDark ? "bg-hero-foreground/10 border-hero-muted/30 text-hero-foreground placeholder:text-hero-muted" : ""}
                                />
                            </div>
                        </div>

                        <div>
                            <Textarea
                                name="message"
                                placeholder="ספרו לנו על צרכי המשרד שלכם (אופציונלי)"
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                                className={isDark ? "bg-hero-foreground/10 border-hero-muted/30 text-hero-foreground placeholder:text-hero-muted resize-none" : "resize-none"}
                            />
                        </div>

						<Button
							type="submit"
							color="primary"
							size="lg"
							disabled={isSubmitting}
							className="w-full text-base py-6 font-semibold shadow-md hover:shadow-lg transition-shadow"
						>
							<Send className="w-4 h-4 ml-2 shrink-0" />
							{isSubmitting ? "שולח..." : "שליחת בקשה"}
						</Button>

						{/* Reassurance micro-copy */}
						<div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-2 text-sm ${isDark ? "text-hero-muted" : "text-muted-foreground"}`}>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 shrink-0" />
								<span>אנחנו בדרך כלל חוזרים תוך 24 שעות</span>
							</div>
							<div className="flex items-center gap-2">
								<Shield className="w-4 h-4 shrink-0" />
								<span>ללא התחייבות</span>
							</div>
						</div>
					</form>
					</div>
				</div>
			</div>
		</section>
	);
};

export default ContactForm;
