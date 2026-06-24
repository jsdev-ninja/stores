import { useHomeProducts } from "./useHomeProducts";
import { useFeaturedProducts } from "./useFeaturedProducts";
import Hero from "./sections/Hero";
import TrendingStrip from "./sections/TrendingStrip";
import Bento from "./sections/Bento";
import Categories from "./sections/Categories";
import MonthlyDeals from "./sections/MonthlyDeals";
import Featured from "./sections/Featured";
import Products from "./sections/Products";
import RecentlyViewed from "./sections/RecentlyViewed";
import Story from "./sections/Story";
import ServiceAreas from "./sections/ServiceAreas";
import Testimonials from "./sections/Testimonials";
import Faq from "./sections/Faq";
import Cta from "./sections/Cta";
import Footer from "./sections/Footer";

/**
 * Balasi storefront home.
 * Products are fetched once from Algolia and distributed as slices to each
 * product section. Categories and discounts come from Redux (loaded in App.tsx).
 */
export default function BalasiHomePage() {
	const { products } = useHomeProducts();

	const heroProducts = products.slice(0, 3);
	const trendingProducts = useFeaturedProducts(products);
	const featuredProducts = products.slice(0, 6);
	const gridProducts = products.slice(0, 8);

	return (
		<div className="min-h-screen bg-[var(--background)]" dir="rtl">
			<Hero products={heroProducts} />
			<TrendingStrip products={trendingProducts} />
			<Bento />
			<Categories />
			<MonthlyDeals />
			<Featured products={featuredProducts} />
			<Products products={gridProducts} />
			<RecentlyViewed />
			<Story />
			<ServiceAreas />
			<Testimonials />
			<Faq />
			<Cta />
			<Footer />
		</div>
	);
}
