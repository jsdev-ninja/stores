import Hero from "./sections/Hero";
import TrendingStrip from "./sections/TrendingStrip";
import Bento from "./sections/Bento";
import Categories from "./sections/Categories";
import MonthlyDeals from "./sections/MonthlyDeals";
import Featured from "./sections/Featured";
import Products from "./sections/Products";
import Story from "./sections/Story";
import ServiceAreas from "./sections/ServiceAreas";
import Testimonials from "./sections/Testimonials";
import Faq from "./sections/Faq";
import Cta from "./sections/Cta";
import Footer from "./sections/Footer";

/**
 * Dev-preview storefront home (tester_store) — full port of the new Balasi
 * design (migration-new-ui/balasi-all), section by section, UI-only.
 * All sections are static illustrative content — no data wiring.
 */
export default function TesterStoreHomePage() {
	return (
		<div className="min-h-screen bg-[var(--background)]" dir="rtl">
			<Hero />
			<TrendingStrip />
			<Bento />
			<Categories />
			<MonthlyDeals />
			<Featured />
			<Products />
			<Story />
			<ServiceAreas />
			<Testimonials />
			<Faq />
			<Cta />
			<Footer />
		</div>
	);
}
