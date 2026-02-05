import { useRef } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import CompleteSolution from "./components/CompleteSolution";
import ProductCategories from "./components/ProductCategories";
import WhyBlesi from "./components/WhyBlesi";
import OrderingOptions from "./components/OrderingOptions";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";

const Index = () => {
	const contactFormRef = useRef<HTMLDivElement>(null);

	const scrollToContact = () => {
		contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-background" dir="rtl">
			<Header onContact={scrollToContact} />

			<Hero onContact={scrollToContact} />

			{/* Complete Office Solution */}
			<CompleteSolution />

			{/* Product Categories */}
			<ProductCategories />

			{/* Why Offices Choose Blesi Store */}
			<WhyBlesi />

			{/* Ordering Options CTA */}
			<OrderingOptions onContact={scrollToContact} />

			{/* Contact Form */}
			<div ref={contactFormRef}>
				<ContactForm variant="light" />
			</div>

			<Footer />
		</div>
	);
};

export default Index;
