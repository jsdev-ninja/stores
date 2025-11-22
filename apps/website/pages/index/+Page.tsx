import logoUrl from "../../assets/logo.png";

export default function Page() {
	return (
		<div className="bg-white w-full min-h-screen" data-node-id="3:2">
			{/* Hero Section */}
			<section className="bg-white min-h-screen relative overflow-hidden">
				{/* Navigation */}
				<nav className="bg-white h-auto md:h-[108px] flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 md:px-8 lg:px-[135px] py-4 md:py-0 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
					<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-0 w-full sm:w-auto justify-between sm:justify-start">
						<div className="flex items-center gap-2 sm:gap-3">
							<img 
								src={logoUrl} 
								alt="Moon Logo" 
								className="size-10 object-contain"
							/>
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
							<a href="#" className="font-['Poppins',sans-serif] font-semibold text-xs sm:text-sm md:text-[15px] text-[#383a3e] relative">
								Features
								<span className="absolute bottom-[-8px] left-0 w-[19px] h-0.5 bg-[#ff8c65]"></span>
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]">
								Pricing
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]">
								Integrations
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]">
								Solution
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#767981]">
								Resource
							</a>
						</div>
						<div className="flex items-center gap-2 sm:gap-3 md:gap-5">
							<a href="#" className="font-['Roboto',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] text-[#2c343d]">
								Log in
							</a>
							<button className="bg-[#3bbf9e] text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-md font-['Roboto',sans-serif] font-medium text-xs sm:text-sm md:text-[15px] whitespace-nowrap">
								Try Free
							</button>
						</div>
					</div>
				</nav>

				{/* Hero Content */}
				<div className="px-4 sm:px-6 md:px-8 lg:px-[135px] pt-8 sm:pt-12 md:pt-20 lg:pt-[181px] pb-8 sm:pb-12 md:pb-20 lg:pb-[215px] relative">
					<div className="max-w-7xl mx-auto">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">
							{/* Left Content */}
							<div className="max-w-full lg:max-w-[469px] order-2 lg:order-1">
								<div className="bg-[#def9f2] inline-block px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded mb-3 sm:mb-4 md:mb-5 lg:mb-6">
									<span className="font-['Poppins',sans-serif] font-medium text-[11px] sm:text-xs md:text-sm lg:text-[14px] text-[#27b290]">
										Deal Flow CRM Software
									</span>
								</div>
								<h2 className="font-['Poppins',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] leading-[1.1] sm:leading-[1.1] md:leading-[1.1] lg:leading-[1.06] text-[#0d152f] tracking-[-0.01em] sm:tracking-[-0.02em] md:tracking-[-0.8px] lg:tracking-[-1.1px] xl:tracking-[-1.28px] mb-3 sm:mb-4 md:mb-5 lg:mb-6">
									<p className="mb-0.5 sm:mb-1 md:mb-[3px] lg:mb-[5px]">Build a CRM</p>
									<p className="mb-0.5 sm:mb-1 md:mb-[3px] lg:mb-[5px]">specifically foe</p>
									<p>manage flow.</p>
								</h2>
								<p className="font-['Roboto',sans-serif] text-[13px] sm:text-sm md:text-base lg:text-[17px] xl:text-[18px] text-[#555966] leading-[1.5] sm:leading-[1.6] md:leading-[1.65] lg:leading-[1.67] mb-5 sm:mb-6 md:mb-8 lg:mb-10">
									Get a clear, unbiased audit of your facebook<br className="hidden sm:block" />
									marketing investment - using plain marketing speak.
								</p>
								<button className="bg-[#ff8257] text-white px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 rounded-lg font-['Roboto',sans-serif] font-medium text-[13px] sm:text-sm md:text-[14px] lg:text-[15px] w-full sm:w-auto">
									Get Started for Free
								</button>
							</div>
							
							{/* Right Image */}
							<div className="order-1 lg:order-2 w-full lg:w-auto flex justify-center lg:justify-end items-center">
								<div className="w-full max-w-[85%] xs:max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-[550px] xl:max-w-[688px] aspect-[688/478] bg-gray-200 rounded-xl sm:rounded-2xl shadow-lg lg:shadow-[-25px_30px_80px_0px_rgba(0,0,0,0.04)]"></div>
							</div>
						</div>
					</div>
				</div>

				{/* Clients */}
				<div className="px-4 sm:px-6 md:px-8 lg:px-[135px] pb-6 sm:pb-8 md:pb-12 lg:pb-[50px] pt-4 sm:pt-6 md:pt-8">
					<p className="text-center font-['Poppins',sans-serif] font-semibold text-xs sm:text-sm md:text-[15px] text-[#838689] mb-3 sm:mb-4 md:mb-6">
						Powering companies like
					</p>
					<div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 items-center min-h-[60px] sm:min-h-[80px] md:min-h-[104px]">
						<div className="w-[100px] sm:w-[120px] md:w-[155px] h-[20px] sm:h-[24px] md:h-[29px] bg-gray-300 rounded"></div>
						<div className="w-[100px] sm:w-[120px] md:w-[149px] h-[20px] sm:h-[24px] md:h-[28px] bg-gray-300 rounded"></div>
						<div className="w-[100px] sm:w-[120px] md:w-[152px] h-[24px] sm:h-[28px] md:h-[34px] bg-gray-300 rounded"></div>
						<div className="w-[100px] sm:w-[120px] md:w-[152px] h-[24px] sm:h-[28px] md:h-[34px] bg-gray-300 rounded"></div>
						<div className="w-[100px] sm:w-[120px] md:w-[154px] h-[20px] sm:h-[24px] md:h-[28px] bg-gray-300 rounded"></div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-white py-12 md:py-16 lg:py-[90px] px-4 md:px-8 lg:px-[245px]">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-5">
					<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
							Real-time updates
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[200px] md:h-[235px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
							Visitors overview
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[200px] md:h-[203px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
							Overview
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[200px] md:h-[232px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-6 md:p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-[30px] text-[#18203a] mb-3 md:mb-4">
							Total Sales
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] text-[#616675] leading-5 md:leading-[25px] mb-4 md:mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[200px] md:h-[218px] bg-gray-200 rounded-xl"></div>
					</div>
				</div>
			</section>

			{/* Service Section */}
			<section className="bg-[#141415] py-12 md:py-16 lg:py-[110px] px-4 md:px-8 lg:px-[245px]">
				<div className="text-center mb-12 md:mb-16 lg:mb-20">
					<p className="font-['Poppins',sans-serif] font-medium text-xs md:text-[14px] text-[#ff8257] tracking-[2.8px] uppercase mb-3 md:mb-4">
						SERVICE WE PROVIDE
					</p>
					<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-4 md:mb-6">
						CRM simple yet powerful
					</h2>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[16px] text-white opacity-50 max-w-full md:max-w-[529px] mx-auto">
						Donec luctus, risus a ornare ultrices, lacus ligula pellentesque massa, sit amet elementum libero ac ipsum. Nulla facilisi.
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Simplied card issuing
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="bg-[#272829] rounded-2xl p-6 md:p-8 text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Streamlined checkout
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Smart dashboard
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque dignissim bibendum lacus.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Optimized platforms
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Faster transaction approval
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-4 md:mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-base md:text-[16px] mb-3 md:mb-4">
							Support available 24/7
						</h3>
						<p className="font-['Roboto',sans-serif] text-sm md:text-[14px] opacity-40 leading-5 md:leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
				</div>
			</section>

			{/* Video Section */}
			<section className="bg-[#141415] py-12 md:py-16 lg:py-[70px] px-4 md:px-8 lg:px-[245px]">
				<div className="text-center mb-8 md:mb-12">
					<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-3 md:mb-4">
						Grows with <span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px]">Moon</span>
					</h2>
					<p className="font-['Roboto',sans-serif] text-sm md:text-[16px] text-white opacity-50 max-w-full md:max-w-[629px] mx-auto">
						usinesses are almost always motivated to grow. Teams multiply, opportunities expand, and your business process can become more complex. A free CRM system, such as Freshworks CRM, scales with your business
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

			{/* Sales & Growth Section */}
			<section className="bg-[#141415] py-12 md:py-16 lg:py-[82px] px-4 md:px-8 lg:px-[245px]">
				<div className="text-center mb-10 md:mb-12 lg:mb-16">
					<p className="font-['Poppins',sans-serif] font-medium text-xs md:text-[14px] text-[#434344] tracking-[2.8px] uppercase mb-3 md:mb-4">
						SALES AND GROWTH
					</p>
					<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white">
						Increase your reach
					</h2>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
					{[85, 70, 42, 20].map((percentage, index) => {
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
									{['Product sales', 'Project Pending', 'Project completed', 'Project Rejected'][index]}
								</h3>
								<p className="font-['Roboto',sans-serif] text-xs md:text-sm lg:text-[14px] opacity-40">
									Charles Jeffrey up the kyver loo in my flat blimey.!
								</p>
							</div>
						);
					})}
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-[#141415] py-12 md:py-16 lg:py-[70px] px-4 md:px-8 lg:px-[245px]">
				<div className="bg-[#2ab08f] rounded-[20px] p-8 md:p-10 lg:p-12 max-w-full md:max-w-[950px] mx-auto relative overflow-hidden">
					<div className="relative z-10">
						<h2 className="font-['Poppins',sans-serif] font-semibold text-2xl md:text-3xl lg:text-[30px] text-white mb-3 md:mb-4">
							Want To Get Started?
						</h2>
						<p className="font-['Roboto',sans-serif] text-sm md:text-base lg:text-[16px] text-white opacity-80 mb-6 md:mb-8 max-w-full md:max-w-[330px]">
							The free demo comes with no commitments and no credit card required.
						</p>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
							<div className="flex-1 border-b border-white/30 pb-2">
								<input
									type="email"
									placeholder="Add your email"
									className="bg-transparent text-white placeholder-white/57 font-['Poppins',sans-serif] font-medium text-xs md:text-sm lg:text-[12px] w-full outline-none"
								/>
							</div>
							<button className="bg-white w-full sm:w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
								<svg className="w-5 h-5 text-[#2ab08f] rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="bg-[#141415] py-12 md:py-16 lg:py-[60px] px-4 md:px-8 lg:px-[245px]">
				<h2 className="font-['Poppins',sans-serif] font-semibold text-3xl md:text-4xl lg:text-[40px] text-white mb-8 md:mb-12">
					Our happy clients
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-[#1d1e1f] rounded-2xl p-6 md:p-8">
							<p className="font-['Roboto',sans-serif] text-sm md:text-base lg:text-[16px] text-white/40 leading-6 md:leading-[30px] mb-6 md:mb-8">
								"Our team deals with sensitive data and our customers trust us to keep it all secure. That's why we trust Stratus, because we can't afford any data loss or outage."
							</p>
							<div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
								<div className="w-10 h-10 md:w-12 md:h-12 bg-gray-600 rounded-full flex-shrink-0"></div>
								<div>
									<p className="font-['Roboto',sans-serif] font-medium text-sm md:text-[14px] text-white mb-1">
										Shiyla Doe
									</p>
									<p className="font-['Roboto',sans-serif] text-xs md:text-[12px] text-[#777879]">
										Manager, MENY
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<img 
									src={logoUrl} 
									alt="Moon Logo" 
									className="w-8 h-8 md:w-9 md:h-9 object-contain"
								/>
								<span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px] text-white">Moon</span>
							</div>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-3 md:gap-4">
					<button className="w-12 h-10 md:w-14 md:h-10 border border-[#2e2f30] rounded-lg flex items-center justify-center">
						<svg className="w-4 h-4 md:w-5 md:h-5 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button className="w-12 h-10 md:w-14 md:h-10 bg-white rounded-lg flex items-center justify-center">
						<svg className="w-4 h-4 md:w-5 md:h-5 text-[#141415]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-[#141415] py-12 md:py-16 lg:py-[130px] px-4 md:px-8 lg:px-[245px]">
				<div className="border-t border-white/10 pt-8 md:pt-12">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
								COMPANY
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
								<p>About Us</p>
								<p>Careers</p>
								<p>Contact</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
								PRODUCT
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
								<p>Features</p>
								<p>Pricing</p>
								<p>Login</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
								RESOURCES
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
								<p>Help</p>
								<p>Blog</p>
								<p>Status</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
								PERFORMANCE
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60">
								<p>Media</p>
								<p>Reach</p>
								<p>Creative</p>
							</div>
						</div>
						<div className="col-span-2 md:col-span-1">
							<p className="font-['Poppins',sans-serif] font-semibold text-xs md:text-sm lg:text-[14px] text-white mb-3 md:mb-4 tracking-[0.28px]">
								GET IN TOUCH
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-sm md:text-[14px] text-white/60 leading-[22px]">
								<p>+0077 4544 4543</p>
								<p>hello@mail.com</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 md:pt-8">
						<div className="flex items-center gap-3">
							<img 
								src={logoUrl} 
								alt="Moon Logo" 
								className="w-9 h-9 object-contain"
							/>
							<span className="font-['Russo_One',sans-serif] text-2xl md:text-3xl lg:text-[30px] text-white">Moon</span>
						</div>
						<p className="font-['Roboto',sans-serif] text-xs md:text-sm lg:text-[14px] text-white/60 text-center md:text-right">
							All rights reserved UIHUT 2021
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
