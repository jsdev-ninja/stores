import logoUrl from "../../assets/logo.png";
import { resources } from "../../resources";

const r = resources.he;

export default function Footer() {
	return (
		<footer className="bg-[#141415] py-12 md:py-16 lg:py-[130px] px-4 md:px-8 lg:px-[245px]">
			<div className="border-t border-white/10 pt-8 md:pt-12">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
					<div>
						<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
							{r.footer.company.title}
						</p>
						<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
							<p>{r.footer.company.aboutUs}</p>
							<p>{r.footer.company.careers}</p>
							<p>{r.footer.company.contact}</p>
						</div>
					</div>
					<div>
						<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
							{r.footer.product.title}
						</p>
						<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
							<p>{r.footer.product.features}</p>
							<p>{r.footer.product.pricing}</p>
							<p>{r.footer.product.login}</p>
						</div>
					</div>
					<div>
						<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
							{r.footer.resources.title}
						</p>
						<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
							<p>{r.footer.resources.help}</p>
							<p>{r.footer.resources.blog}</p>
							<p>{r.footer.resources.status}</p>
						</div>
					</div>
					<div>
						<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
							{r.footer.performance.title}
						</p>
						<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
							<p>{r.footer.performance.media}</p>
							<p>{r.footer.performance.reach}</p>
							<p>{r.footer.performance.creative}</p>
						</div>
					</div>
					<div className="col-span-2 md:col-span-1">
						<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
							{r.footer.getInTouch.title}
						</p>
						<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60 leading-[22px]">
							<p>{r.footer.getInTouch.phone}</p>
							<p>{r.footer.getInTouch.email}</p>
						</div>
					</div>
				</div>
				<div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 md:pt-8">
					<div className="flex items-center gap-3">
						<img src={logoUrl} alt="JsDev Logo" className="w-9 h-9 object-contain" />
						<span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px] text-white">
							{r.video.brandName}
						</span>
					</div>
					<p className="font-['Roboto',sans-serif] text-xs md:text-sm lg:text-[14px] text-white/60 text-center md:text-right">
						{r.footer.copyright}
					</p>
				</div>
			</div>
		</footer>
	);
}
