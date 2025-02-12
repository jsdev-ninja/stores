import "./App.css";

function App() {
	return (
		<>
			<Navbar />
			<Hero />
		</>
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
		<div className="text-white bg-black bg-[linear-gradient(to_bottom,#000,#200D42_34%,#4F21A1_65%,#A46EDB_82%)] py-72">
			hero
		</div>
	);
}
export default App;
