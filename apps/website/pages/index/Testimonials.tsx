import logoUrl from "../../assets/logo.png";
import { resources } from "../../resources";

const r = resources.he;

export default function Testimonials() {
	return (
		<section className="bg-[#141415] py-12 md:py-16 lg:py-[60px] px-4 md:px-8 lg:px-[245px]">
			<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-8 md:mb-12">
				{r.testimonials.title}
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
				{[1, 2, 3].map((i) => (
					<div key={i} className="bg-[#1d1e1f] rounded-2xl p-6 md:p-8">
						<p className="font-['Roboto',sans-serif] text-sm md:text-base lg:text-[16px] text-white/40 leading-6 md:leading-[30px] mb-6 md:mb-8">
							{r.testimonials.quote}
						</p>
						<div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
							<div className="w-10 h-10 md:w-12 md:h-12 bg-gray-600 rounded-full flex-shrink-0"></div>
							<div>
								<p className="font-['Roboto',sans-serif] font-medium text-sm md:text-[14px] text-white mb-1">
									{r.testimonials.testimonial.name}
								</p>
								<p className="font-['Roboto',sans-serif] text-xs md:text-[12px] text-[#777879]">
									{r.testimonials.testimonial.role}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<img
								src={logoUrl}
								alt="JsDev Logo"
								className="w-8 h-8 md:w-9 md:h-9 object-contain"
							/>
							<span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px] text-white">
								{r.video.brandName}
							</span>
						</div>
					</div>
				))}
			</div>
			<div className="flex justify-end gap-3 md:gap-4">
				<button className="w-12 h-10 md:w-14 md:h-10 border border-[#2e2f30] rounded-lg flex items-center justify-center">
					<svg
						className="w-4 h-4 md:w-5 md:h-5 text-white rotate-180"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
				<button className="w-12 h-10 md:w-14 md:h-10 bg-white rounded-lg flex items-center justify-center">
					<svg
						className="w-4 h-4 md:w-5 md:h-5 text-[#141415]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</section>
	);
}
