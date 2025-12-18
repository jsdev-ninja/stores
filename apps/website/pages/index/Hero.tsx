import logoUrl from "../../assets/logo.png";
import heroImageUrl from "../../assets/hero.png";
import { data } from "../../data";
import { resources } from "../../resources";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const r = resources.he;

export default function Hero() {
	useGSAP(() => {
		gsap
			.timeline({
				scrollTrigger: {
					trigger: "#hero-container",
					start: "top top",
					end: "+=150%",
					pin: true,
					scrub: 1,
				},
			})
			.to("#hero-image", {
				scale: 2,
				transformOrigin: "center center",
				ease: "power1.inOut",
			});
	});
	return (
		<section id="hero-container" className="relative overflow-hidden">
			{/* Navigation */}
			<nav className="h-auto md:h-[108px] flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 md:px-8 lg:px-[135px] py-4 md:py-0 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
				<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-0 w-full sm:w-auto justify-between sm:justify-start">
					<div className="flex items-center gap-2 sm:gap-3">
						<img src={logoUrl} alt="JsDev Logo" className="size-10 object-contain" />
						<h1 className="font-['Russo_One',sans-serif] text-xl sm:text-2xl md:text-[30px] text-[#2c343d] tracking-[-0.6px]">
							JsDev
						</h1>
					</div>
					{/* Mobile menu button */}
					<button className="sm:hidden w-8 h-8 flex flex-col justify-center gap-1.5">
						<span className="w-6 h-0.5 bg-gray-700"></span>
						<span className="w-6 h-0.5 bg-gray-700"></span>
						<span className="w-6 h-0.5 bg-gray-700"></span>
					</button>
				</div>
				<div className="hidden sm:flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full sm:w-auto">
					<div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-8">
						<a
							href="#"
							className="font-['Poppins',sans-serif] font-semibold text-xs sm:text-sm md:text-[15px] text-[#383a3e] relative"
						>
							{r.nav.features}
							<span className="absolute bottom-[-8px] left-0 w-[19px] h-0.5 bg-[#ff8c65]"></span>
						</a>
						<a
							href="#"
							className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]"
						>
							{r.nav.pricing}
						</a>
						<a
							href="#"
							className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]"
						>
							{r.nav.integrations}
						</a>
						<a
							href="#"
							className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]"
						>
							{r.nav.solution}
						</a>
						<a
							href="#"
							className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]"
						>
							{r.nav.resource}
						</a>
					</div>
					<div className="flex items-center gap-2 sm:gap-3 md:gap-5">
						<a
							href="#"
							className="font-['Roboto',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#2c343d]"
						>
							{r.nav.login}
						</a>
						<button className="bg-[#3bbf9e] text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-md font-['Roboto',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] whitespace-nowrap">
							{r.nav.tryFree}
						</button>
					</div>
				</div>
			</nav>

			{/* Hero Content */}
			<div
				id="hero"
				className="relative px-4 sm:px-6 md:px-8 lg:px-[135px] pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 lg:pb-16"
			>
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">
						{/* Left Content */}
						<div className="max-w-full lg:max-w-[469px] order-2 lg:order-1">
							<div className="bg-[#def9f2] inline-block px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded mb-2 sm:mb-3 md:mb-4">
								<span className="font-['Poppins',sans-serif] font-medium text-[11px] sm:text-xs md:text-sm lg:text-[14px] text-[#27b290]">
									{r.hero.badge}
								</span>
							</div>
							<h2 className="font-['Poppins',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] leading-[1.1] sm:leading-[1.1] md:leading-[1.1] lg:leading-[1.06] text-[#0d152f] tracking-[-0.01em] sm:tracking-[-0.02em] md:tracking-[-0.8px] lg:tracking-[-1.1px] xl:tracking-[-1.28px] mb-2 sm:mb-3 md:mb-4 lg:mb-5">
								<p className="mb-0.5 sm:mb-1 md:mb-[3px] lg:mb-[5px]">
									{r.hero.title.line1}
								</p>
								<p className="mb-0.5 sm:mb-1 md:mb-[3px] lg:mb-[5px]">
									{r.hero.title.line2}
								</p>
								<p>{r.hero.title.line3}</p>
							</h2>
							<p className="font-['Roboto',sans-serif] text-[13px] sm:text-sm md:text-base lg:text-[17px] xl:text-[18px] text-[#555966] leading-[1.5] sm:leading-[1.6] md:leading-[1.65] lg:leading-[1.67] mb-4 sm:mb-5 md:mb-6 lg:mb-8">
								{r.hero.description}
							</p>
							<button className="bg-[#ff8257] text-white px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 rounded-lg font-['Roboto',sans-serif] font-medium text-[13px] sm:text-sm md:text-[14px] lg:text-[15px] w-full sm:w-auto">
								{r.hero.cta}
							</button>
						</div>

						{/* Right Image */}
						<div className="order-1 lg:order-2 w-full lg:w-auto flex justify-center lg:justify-end items-center">
							<div className="w-full max-w-[85%] xs:max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-[550px] xl:max-w-[688px]  rounded-xl sm:rounded-2xl">
								<img
									id="hero-image"
									src={heroImageUrl}
									alt="Hero Image"
									className="w-full h-full object-cover"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Clients */}
			<div className="px-4 sm:px-6 md:px-8 lg:px-[135px] pb-4 sm:pb-6 md:pb-8 pt-4 sm:pt-6">
				<p className="text-center font-['Poppins',sans-serif] font-semibold text-xs sm:text-sm md:text-[15px] text-[#838689] mb-3 sm:mb-4 md:mb-6">
					{r.hero.clients}
				</p>
				<div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 items-center min-h-[60px] sm:min-h-[80px] md:min-h-[104px]">
					{data.stores.map((store) => (
						<div
							key={store.name}
							className="w-[100px] sm:w-[120px] md:w-[155px] h-[20px] sm:h-[24px] md:h-[29px] bg-gray-300 rounded"
						>
							<span className="text-white">{store.name}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
