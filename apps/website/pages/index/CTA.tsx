import { resources } from "../../resources";

const r = resources.he;

export default function CTA() {
	return (
		<section className="bg-[#141415] py-12 md:py-16 lg:py-[70px] px-4 md:px-8 lg:px-[245px]">
			<div className="bg-[#2ab08f] rounded-[20px] p-8 md:p-10 lg:p-12 max-w-full md:max-w-[950px] mx-auto relative overflow-hidden">
				<div className="relative z-10">
					<h2 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-3xl lg:text-[30px] text-white mb-3 md:mb-4">
						{r.cta.title}
					</h2>
					<p className="font-['Roboto',sans-serif] text-sm md:text-base lg:text-[16px] text-white opacity-80 mb-6 md:mb-8 max-w-full md:max-w-[330px]">
						{r.cta.description}
					</p>
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
						<div className="flex-1 border-b border-white/30 pb-2">
							<input
								type="email"
								placeholder={r.cta.emailPlaceholder}
								className="bg-transparent text-white placeholder-white/57 font-['Poppins',sans-serif] font-medium text-xs md:text-sm lg:text-[12px] w-full outline-none"
							/>
						</div>
						<button className="bg-white w-full sm:w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg
								className="w-5 h-5 text-[#2ab08f] rotate-180"
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
				</div>
			</div>
		</section>
	);
}
