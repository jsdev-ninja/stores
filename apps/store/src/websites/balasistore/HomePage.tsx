import { useRef } from "react";
import { useTranslation } from "react-i18next";
import Header from "src/pages/store/HomePage/components/Header";
import Hero from "src/pages/store/HomePage/components/Hero";
import CompleteSolution from "src/pages/store/HomePage/components/CompleteSolution";
import ProductCategories from "src/pages/store/HomePage/components/ProductCategories";
import WhyBlesi from "src/pages/store/HomePage/components/WhyBlesi";
import OrderingOptions from "src/pages/store/HomePage/components/OrderingOptions";
import ContactForm from "src/pages/store/HomePage/components/ContactForm";
import Footer from "src/pages/store/HomePage/components/Footer";

export default function BalasiStoreHomePage() {
	const contactFormRef = useRef<HTMLDivElement>(null);
	const { t } = useTranslation(["common", "homePage"]);

	const scrollToContact = () => {
		contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-background" dir="rtl">
			<Header onContact={scrollToContact} />
			<div className="bg-default-100 border-b border-default-200">
				<div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
					<span className="font-semibold text-foreground">{t("homePage:forOfficesOnly")}</span>
					<span className="text-default-600">{t("homePage:pricesBeforeVat")}</span>
				</div>
			</div>
			<Hero onContact={scrollToContact} />
			<CompleteSolution />
			<ProductCategories />
			<WhyBlesi />
			<OrderingOptions onContact={scrollToContact} />
			<div ref={contactFormRef}>
				<ContactForm variant="light" />
			</div>
			<Footer />
		</div>
	);
}
