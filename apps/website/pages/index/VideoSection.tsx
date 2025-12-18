import { resources } from "../../resources";

const r = resources.he;

export default function VideoSection() {
	return (
		<section className="bg-[#141415] py-12 md:py-16 lg:py-[70px] px-4 md:px-8 lg:px-[245px]">
			<div className="text-center mb-8 md:mb-12">
				<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-3 md:mb-4">
					{r.video.title} <span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px]">{r.video.brandName}</span>
				</h2>
				<p className="font-['Roboto',sans-serif] text-sm md:text-[16px] text-white opacity-50 max-w-full md:max-w-[629px] mx-auto">
					{r.video.description}
				</p>
			</div>
			<div className="max-w-full md:max-w-[698px] mx-auto">
				<div className="bg-[#1d1e1f] rounded-lg aspect-video md:h-[495px] mb-3 md:mb-4 relative">
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center">
							<div className="w-0 h-0 border-l-[16px] md:border-l-[20px] border-l-white border-t-[10px] md:border-t-[12px] border-t-transparent border-b-[10px] md:border-b-[12px] border-b-transparent ml-1"></div>
						</div>
					</div>
				</div>
				<div className="bg-[#2e2e30] rounded h-8 md:h-[33px] flex items-center px-3 md:px-4 gap-2 md:gap-4">
					<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded"></div>
					<div className="flex-1 h-0.5 md:h-1 bg-[#4c4c4e] rounded-full">
						<div className="w-[79%] h-full bg-white rounded-full"></div>
					</div>
					<span className="text-white text-xs md:text-sm font-['Roboto',sans-serif] font-medium">1:39</span>
					<div className="w-3 h-3 md:w-4 md:h-4 bg-white/20 rounded"></div>
					<div className="w-3 h-3 md:w-4 md:h-4 bg-white/20 rounded"></div>
					<div className="w-3 h-3 md:w-4 md:h-4 bg-white/20 rounded"></div>
				</div>
			</div>
		</section>
	);
}
