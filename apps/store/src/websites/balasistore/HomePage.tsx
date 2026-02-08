import { useRef } from "react";
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

	const scrollToContact = () => {
		contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-background" dir="rtl">
			<Header onContact={scrollToContact} />
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
