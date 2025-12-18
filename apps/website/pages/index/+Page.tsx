import Hero from "./Hero";
import Features from "./Features";
import Services from "./Services";
import VideoSection from "./VideoSection";
import SalesAndGrowth from "./SalesAndGrowth";
import CTA from "./CTA";
import Testimonials from "./Testimonials";
import Footer from "./Footer";

export default function Page() {
	return (
		<div className="w-full min-h-screen" data-node-id="3:2">
			<Hero />
			<Features />
			<Services />
			<VideoSection />
			<SalesAndGrowth />
			<CTA />
			<Testimonials />
			<Footer />
		</div>
	);
}
