import { resources } from "../../resources";

const r = resources.he;

export default function SalesAndGrowth() {
	const stats = [
		r.salesAndGrowth.stats.productSales,
		r.salesAndGrowth.stats.projectPending,
		r.salesAndGrowth.stats.projectCompleted,
		r.salesAndGrowth.stats.projectRejected,
	];
	const percentages = [85, 70, 42, 20];

	return (
		<section className="bg-[#141415] py-12 md:py-16 lg:py-[82px] px-4 md:px-8 lg:px-[245px]">
			<div className="text-center mb-10 md:mb-12 lg:mb-16">
				<p className="font-['Poppins',sans-serif] font-medium text-xs md:text-[14px] text-[#434344] tracking-[2.8px] uppercase mb-3 md:mb-4">
					{r.salesAndGrowth.badge}
				</p>
				<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white">
					{r.salesAndGrowth.title}
				</h2>
			</div>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
				{percentages.map((percentage, index) => {
					const radius = 75;
					const circumference = 2 * Math.PI * radius;
					const offset = circumference - (percentage / 100) * circumference;
					return (
						<div key={index} className="text-center text-white">
							<div className="relative w-[120px] md:w-[140px] lg:w-[165px] h-[120px] md:h-[140px] lg:h-[165px] mx-auto mb-4 md:mb-6">
								<svg className="w-full h-full transform -rotate-90" viewBox="0 0 165 165">
									<circle
										cx="82.5"
										cy="82.5"
										r={radius}
										fill="none"
										stroke="#2e2f30"
										strokeWidth="15"
									/>
									<circle
										cx="82.5"
										cy="82.5"
										r={radius}
										fill="none"
										stroke="#696c70"
										strokeWidth="15"
										strokeDasharray={circumference}
										strokeDashoffset={offset}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="font-['Poppins',sans-serif] font-medium text-2xl md:text-3xl lg:text-[34px] text-[#696c70]">
										{percentage}%
									</span>
								</div>
							</div>
							<h3 className="font-['Poppins',sans-serif] font-semibold text-sm md:text-base lg:text-[16px] mb-2">
								{stats[index]}
							</h3>
							<p className="font-['Roboto',sans-serif] text-xs md:text-sm lg:text-[14px] opacity-40">
								{r.salesAndGrowth.description}
							</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}
