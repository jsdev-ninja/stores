export default function Page() {
	return (
		<div className="bg-white w-full min-h-screen" data-node-id="3:2">
			{/* Hero Section */}
			<section className="bg-white min-h-[963px] relative">
				{/* Navigation */}
				<nav className="bg-white h-[108px] flex items-center justify-between px-[135px]">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 bg-gray-300 rounded"></div>
						<h1 className="font-['Russo_One',sans-serif] text-[30px] text-[#2c343d] tracking-[-0.6px]">
							Moon
						</h1>
					</div>
					<div className="flex items-center gap-8">
						<div className="flex items-center gap-8">
							<a href="#" className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#383a3e] relative">
								Features
								<span className="absolute bottom-[-8px] left-0 w-[19px] h-0.5 bg-[#ff8c65]"></span>
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-[15px] text-[#767981]">
								Pricing
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-[15px] text-[#767981]">
								Integrations
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-[15px] text-[#767981]">
								Solution
							</a>
							<a href="#" className="font-['Poppins',sans-serif] font-medium text-[15px] text-[#767981]">
								Resource
							</a>
						</div>
						<div className="flex items-center gap-5">
							<a href="#" className="font-['Roboto',sans-serif] font-medium text-[15px] text-[#2c343d]">
								Log in
							</a>
							<button className="bg-[#3bbf9e] text-white px-6 py-3 rounded-md font-['Roboto',sans-serif] font-medium text-[15px]">
								Try Free
							</button>
						</div>
					</div>
				</nav>

				{/* Hero Content */}
				<div className="px-[135px] pt-[181px] pb-[215px] relative">
					<div className="max-w-[469px]">
						<div className="bg-[#def9f2] inline-block px-5 py-2 rounded mb-6">
							<span className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#27b290]">
								Deal Flow CRM Software
							</span>
						</div>
						<h2 className="font-['Poppins',sans-serif] font-semibold text-[64px] leading-[68px] text-[#0d152f] tracking-[-1.28px] mb-6">
							<p className="mb-[5px]">Build a CRM</p>
							<p className="mb-[5px]">specifically foe</p>
							<p>manage flow.</p>
						</h2>
						<p className="font-['Roboto',sans-serif] text-[18px] text-[#555966] leading-[30px] mb-10">
							Get a clear, unbiased audit of your facebook<br />
							marketing investment - using plain marketing speak.
						</p>
						<button className="bg-[#ff8257] text-white px-8 py-4 rounded-lg font-['Roboto',sans-serif] font-medium text-[15px]">
							Get Started for Free
						</button>
					</div>
					<div className="absolute right-[77px] top-[170px] w-[688px] h-[478px] bg-gray-200 rounded-2xl shadow-[-25px_30px_80px_0px_rgba(0,0,0,0.04)]"></div>
				</div>

				{/* Clients */}
				<div className="px-[135px] pb-[50px]">
					<p className="text-center font-['Poppins',sans-serif] font-semibold text-[15px] text-[#838689] mb-4">
						Powering companies like
					</p>
					<div className="flex justify-center gap-8 items-center h-[104px]">
						<div className="w-[155px] h-[29px] bg-gray-300 rounded"></div>
						<div className="w-[149px] h-[28px] bg-gray-300 rounded"></div>
						<div className="w-[152px] h-[34px] bg-gray-300 rounded"></div>
						<div className="w-[152px] h-[34px] bg-gray-300 rounded"></div>
						<div className="w-[154px] h-[28px] bg-gray-300 rounded"></div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-white py-[90px] px-[245px]">
				<div className="grid grid-cols-2 gap-5">
					<div className="bg-[#fafafc] rounded-2xl p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[30px] text-[#18203a] mb-4">
							Real-time updates
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] text-[#616675] leading-[25px] mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[235px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[30px] text-[#18203a] mb-4">
							Visitors overview
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] text-[#616675] leading-[25px] mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[203px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[30px] text-[#18203a] mb-4">
							Overview
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] text-[#616675] leading-[25px] mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[232px] bg-gray-200 rounded-xl"></div>
					</div>
					<div className="bg-[#fafafc] rounded-2xl p-10">
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[30px] text-[#18203a] mb-4">
							Total Sales
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] text-[#616675] leading-[25px] mb-6">
							Keep everyone connected all the time with continuously updated data.
						</p>
						<div className="w-full h-[218px] bg-gray-200 rounded-xl"></div>
					</div>
				</div>
			</section>

			{/* Service Section */}
			<section className="bg-[#141415] py-[110px] px-[245px]">
				<div className="text-center mb-20">
					<p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#ff8257] tracking-[2.8px] uppercase mb-4">
						SERVICE WE PROVIDE
					</p>
					<h2 className="font-['Poppins',sans-serif] font-semibold text-[40px] text-white mb-6">
						CRM simple yet powerful
					</h2>
					<p className="font-['Roboto',sans-serif] text-[16px] text-white opacity-50 max-w-[529px] mx-auto">
						Donec luctus, risus a ornare ultrices, lacus ligula pellentesque massa, sit amet elementum libero ac ipsum. Nulla facilisi.
					</p>
				</div>
				<div className="grid grid-cols-3 gap-6">
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Simplied card issuing
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="bg-[#272829] rounded-2xl p-8 text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Streamlined checkout
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Smart dashboard
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque dignissim bibendum lacus.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Optimized platforms
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Faster transaction approval
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
					<div className="text-white">
						<div className="w-[45px] h-[45px] bg-gray-600 rounded mb-6"></div>
						<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-4">
							Support available 24/7
						</h3>
						<p className="font-['Roboto',sans-serif] text-[14px] opacity-40 leading-6">
							Maecenas accumsan, elit id hendrerit convallis, lectus lacus fermentum nisi.
						</p>
					</div>
				</div>
			</section>

			{/* Video Section */}
			<section className="bg-[#141415] py-[70px] px-[245px]">
				<div className="text-center mb-12">
					<h2 className="font-['Poppins',sans-serif] font-semibold text-[40px] text-white mb-4">
						Grows with <span className="font-['Russo_One',sans-serif] text-[30px]">Moon</span>
					</h2>
					<p className="font-['Roboto',sans-serif] text-[16px] text-white opacity-50 max-w-[629px] mx-auto">
						usinesses are almost always motivated to grow. Teams multiply, opportunities expand, and your business process can become more complex. A free CRM system, such as Freshworks CRM, scales with your business
					</p>
				</div>
				<div className="max-w-[698px] mx-auto">
					<div className="bg-[#1d1e1f] rounded-lg h-[495px] mb-4 relative">
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
								<div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
							</div>
						</div>
					</div>
					<div className="bg-[#2e2e30] rounded h-[33px] flex items-center px-4 gap-4">
						<div className="w-3 h-3 bg-white rounded"></div>
						<div className="flex-1 h-1 bg-[#4c4c4e] rounded-full">
							<div className="w-[79%] h-full bg-white rounded-full"></div>
						</div>
						<span className="text-white text-sm font-['Roboto',sans-serif] font-medium">1:39</span>
						<div className="w-4 h-4 bg-white/20 rounded"></div>
						<div className="w-4 h-4 bg-white/20 rounded"></div>
						<div className="w-4 h-4 bg-white/20 rounded"></div>
					</div>
				</div>
			</section>

			{/* Sales & Growth Section */}
			<section className="bg-[#141415] py-[82px] px-[245px]">
				<div className="text-center mb-16">
					<p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#434344] tracking-[2.8px] uppercase mb-4">
						SALES AND GROWTH
					</p>
					<h2 className="font-['Poppins',sans-serif] font-semibold text-[40px] text-white">
						Increase your reach
					</h2>
				</div>
				<div className="grid grid-cols-4 gap-8">
					{[85, 70, 42, 20].map((percentage, index) => (
						<div key={index} className="text-center text-white">
							<div className="relative w-[165px] h-[165px] mx-auto mb-6">
								<svg className="w-full h-full transform -rotate-90">
									<circle
										cx="82.5"
										cy="82.5"
										r="75"
										fill="none"
										stroke="#2e2f30"
										strokeWidth="15"
									/>
									<circle
										cx="82.5"
										cy="82.5"
										r="75"
										fill="none"
										stroke="#696c70"
										strokeWidth="15"
										strokeDasharray={`${(percentage / 100) * 471.24} 471.24`}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="font-['Poppins',sans-serif] font-medium text-[34px] text-[#696c70]">
										{percentage}%
									</span>
								</div>
							</div>
							<h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] mb-2">
								{['Product sales', 'Project Pending', 'Project completed', 'Project Rejected'][index]}
							</h3>
							<p className="font-['Roboto',sans-serif] text-[14px] opacity-40">
								Charles Jeffrey up the kyver loo in my flat blimey.!
							</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-[#141415] py-[70px] px-[245px]">
				<div className="bg-[#2ab08f] rounded-[20px] p-12 max-w-[950px] mx-auto relative overflow-hidden">
					<div className="relative z-10">
						<h2 className="font-['Poppins',sans-serif] font-semibold text-[30px] text-white mb-4">
							Want To Get Started?
						</h2>
						<p className="font-['Roboto',sans-serif] text-[16px] text-white opacity-80 mb-8 max-w-[330px]">
							The free demo comes with no commitments and no credit card required.
						</p>
						<div className="flex items-center gap-4">
							<div className="flex-1 border-b border-white/30 pb-2">
								<input
									type="email"
									placeholder="Add your email"
									className="bg-transparent text-white placeholder-white/57 font-['Poppins',sans-serif] font-medium text-[12px] w-full outline-none"
								/>
							</div>
							<button className="bg-white w-14 h-10 rounded-lg flex items-center justify-center">
								<svg className="w-5 h-5 text-[#2ab08f] rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="bg-[#141415] py-[60px] px-[245px]">
				<h2 className="font-['Poppins',sans-serif] font-semibold text-[40px] text-white mb-12">
					Our happy clients
				</h2>
				<div className="grid grid-cols-3 gap-6 mb-8">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-[#1d1e1f] rounded-2xl p-8">
							<p className="font-['Roboto',sans-serif] text-[16px] text-white/40 leading-[30px] mb-8">
								"Our team deals with sensitive data and our customers trust us to keep it all secure. That's why we trust Stratus, because we can't afford any data loss or outage."
							</p>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-gray-600 rounded-full"></div>
								<div>
									<p className="font-['Roboto',sans-serif] font-medium text-[14px] text-white mb-1">
										Shiyla Doe
									</p>
									<p className="font-['Roboto',sans-serif] text-[12px] text-[#777879]">
										Manager, MENY
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 mt-6">
								<div className="w-9 h-9 bg-gray-600 rounded"></div>
								<span className="font-['Russo_One',sans-serif] text-[30px] text-white">Moon</span>
							</div>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-4">
					<button className="w-14 h-10 border border-[#2e2f30] rounded-lg flex items-center justify-center">
						<svg className="w-5 h-5 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button className="w-14 h-10 bg-white rounded-lg flex items-center justify-center">
						<svg className="w-5 h-5 text-[#141415]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-white py-[130px] px-[245px]">
				<div className="border-t border-gray-200 pt-12">
					<div className="grid grid-cols-5 gap-12 mb-12">
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#383a3e] mb-4 tracking-[0.28px]">
								COMPANY
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-[14px] text-[#434755]">
								<p>About Us</p>
								<p>Careers</p>
								<p>Contact</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#383a3e] mb-4 tracking-[0.28px]">
								PRODUCT
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-[14px] text-[#434755]">
								<p>Features</p>
								<p>Pricing</p>
								<p>Login</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#383a3e] mb-4 tracking-[0.28px]">
								RESOURCES
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-[14px] text-[#434755]">
								<p>Help</p>
								<p>Blog</p>
								<p>Status</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#383a3e] mb-4 tracking-[0.28px]">
								PERFORMANCE
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-[14px] text-[#434755]">
								<p>Media</p>
								<p>Reach</p>
								<p>Creative</p>
							</div>
						</div>
						<div>
							<p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#383a3e] mb-4 tracking-[0.28px]">
								GET IN TOUCH
							</p>
							<div className="space-y-2 font-['Roboto',sans-serif] text-[14px] text-[#434755] leading-[22px]">
								<p>+0077 4544 4543</p>
								<p>hello@mail.com</p>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-between pt-8">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 bg-gray-300 rounded"></div>
							<span className="font-['Russo_One',sans-serif] text-[30px] text-[#2c343d]">Moon</span>
						</div>
						<p className="font-['Roboto',sans-serif] text-[14px] text-[#7d818e]">
							All rights reserved UIHUT 2021
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
