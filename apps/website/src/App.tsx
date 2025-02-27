import "./App.css";

const content = {
	navbar: {},
	hero: {},
} as const;

function App() {
	return (
		<div dir="rtl" className="overflow-x-hidden">
			<Hero />
		</div>
	);
}

function Hero() {
	const links: { name: string; path: string }[] = [
		{
			name: "Home",
			path: "home",
		},
		{
			name: "Pricing",
			path: "pricing",
		},
		{
			name: "Feature",
			path: "feature",
		},
		{
			name: "Who to work",
			path: "whoToWork",
		},
		{
			name: "Reviews",
			path: "reviews",
		},
	] as const;
	return (
		<div className="h-screen w-screen bg-[#0D1728] relative">
			<div className="origin-top-left w-2/5 absolute h-[150%] shrink-0 opacity-5 bg-white rotate-[-30deg]"></div>
			<div className="origin-[0%_40%] w-2/5 absolute end-0 h-[150%] shrink-0 opacity-5 bg-white rotate-[-30deg]"></div>
			{/* nav */}
			<div className="container relative mx-auto p-4 z-10">
				<div className="flex items-center justify-between">
					<img src="logo.svg" className="h-16 w-40" alt="" />
					<div className="items-center gap-12 hidden lg:flex">
						{links.map((link) => (
							<a
								href={link.path}
								className="text-white text-xl opacity-60 active:opacity-100"
								key={link.name}
							>
								{link.name}
							</a>
						))}
					</div>
					<button className="rounded-2xl shrink-0 bg-white py-3.5 px-6 cursor-pointer hover:scale-105 transition text-[#293241]">
						start free trial
					</button>
				</div>
				<div className="text-white opacity-70 md:text-2xl mx-auto w-full mt-12 text-center">
					Using basic skills you can improve your business stuff with Around
				</div>
				<div className="text-white font-semibold text-2xl w-full md:text-7xl mx-auto md:w-3/4 mt-12 text-center">
					One Dashboard to Manage all Your businesses
				</div>

				<div
					dir="ltr"
					className="border border-white rounded-full h-12 md:h-16 my-6 max-w-md mx-auto relative"
				>
					<input
						type="text"
						placeholder="enter your email"
						className="border text-white h-full w-full rounded-[inherit] px-4"
					/>
					<button className="bg-white absolute h-full  rounded-[inherit] w-40 end-0 cursor-pointer">
						start
					</button>
				</div>

				<div className="rounded-4xl border-8 border-gray-700 h-screen">
					<img src="bg.svg" className="w-full h-full object-cover" alt="" />
				</div>
			</div>
		</div>
	);
}
export default App;
