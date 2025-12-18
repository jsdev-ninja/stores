import { resources } from "../../resources";

const r = resources.he;

export default function Features() {
	return (
		<section className="bg-white py-12 md:py-16 lg:py-[90px] px-4 md:px-8 lg:px-[245px]">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-5">
				<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
					<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
						{r.features.realTimeUpdates.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
						{r.features.realTimeUpdates.description}
					</p>
					<div className="w-full h-[200px] md:h-[235px] bg-gray-200 rounded-xl"></div>
				</div>
				<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
					<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
						{r.features.visitorsOverview.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
						{r.features.visitorsOverview.description}
					</p>
					<div className="w-full h-[200px] md:h-[203px] bg-gray-200 rounded-xl"></div>
				</div>
				<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
					<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
						{r.features.overview.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
						{r.features.overview.description}
					</p>
					<div className="w-full h-[200px] md:h-[232px] bg-gray-200 rounded-xl"></div>
				</div>
				<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
					<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
						{r.features.totalSales.title}
					</h3>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
						{r.features.totalSales.description}
					</p>
					<div className="w-full h-[200px] md:h-[218px] bg-gray-200 rounded-xl"></div>
				</div>
			</div>
		</section>
	);
}
