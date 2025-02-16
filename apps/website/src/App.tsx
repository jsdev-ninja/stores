import "./App.css";

const content = {
	navbar: {},
	hero: {},
} as const;

function App() {
	return (
		<div dir="rtl" className="overflow-hidden">
			<Navbar />
			<Hero />
		</div>
	);
}

function Navbar() {
	return (
		<div className="bg-[#000000] px-4 py-4 h-20 text-white flex items-center">
			<img src="/vite.svg" className="size-8" alt="" />
		</div>
	);
}

function Hero() {
	return (
		<div className="text-white text-center bg-black bg-[linear-gradient(to_bottom,#000,#200D42_34%,#4F21A1_65%,#A46EDB_82%)] py-72 relative w-full">
			<button className="bg-white text-black px-4 py-2 rounded cursor-pointer">
				get it free
			</button>
			<div className="absolute w-[909px] h-[359px]  top-[calc(100%-96px)] left-1/2  -translate-x-1/2     border-[#B48CDE] bg-[radial-gradient(closest-side,#000_69%,#9560EB)]"></div>
		</div>
	);
}
export default App;
