import { resources } from "../../resources";

const r = resources.he;

export default function Services() {
	return (
		<section className="bg-[#141415] py-12 md:py-16 lg:py-[110px] px-4 md:px-8 lg:px-[245px]">
			<div className="text-center mb-12 md:mb-16 lg:mb-20">
				<p className="font-['Poppins',sans-serif] font-medium text-xs md:text-[14px] text-[#ff8257] tracking-[2.8px] uppercase mb-3 md:mb-4">
					{r.services.badge}
				</p>
				<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-4 md:mb-6">
					{r.services.title}
				</h2>
				<p className="font-['Roboto',sans-serif] text-sm md:text-[16px] text-white opacity-50 max-w-full md:max-w-[529px] mx-auto">
					{r.services.description}
				</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
				<div className="text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.simplifiedCardIssuing.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.simplifiedCardIssuing.description}
					</p>
				</div>
				<div className="bg-[#272829] rounded-2xl p-6 md:p-8 text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.streamlinedCheckout.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.streamlinedCheckout.description}
					</p>
				</div>
				<div className="text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.smartDashboard.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.smartDashboard.description}
					</p>
				</div>
				<div className="text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.optimizedPlatforms.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.optimizedPlatforms.description}
					</p>
				</div>
				<div className="text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.fasterTransactionApproval.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.fasterTransactionApproval.description}
					</p>
				</div>
				<div className="text-white">
					<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
					<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
						{r.services.items.supportAvailable247.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
						{r.services.items.supportAvailable247.description}
					</p>
				</div>
			</div>
		</section>
	);
}
