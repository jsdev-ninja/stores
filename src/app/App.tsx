import { useEffect, useState } from "react";

import "./App.scss";

import { Provider } from "react-redux";

import { tv } from "tailwind-variants";
import { Button, NextUIProvider, ButtonGroup } from "@nextui-org/react";
import { AppBar } from ".././widgets/AppBar";
import { SideNavigator } from ".././widgets/SideNavigator";
import { useTranslation } from "react-i18next";
import { Product } from ".././widgets/Product";
import { TProduct } from ".././domains/product/types";
import { store } from "src/infra/store";
import { Route } from "src/navigation";
import { ModalProvider } from "src/infra/modals";
import { AddProductPage } from "src/pages/admin/AddProductPage";
import { AdminPage } from "src/pages";
const productCard = tv({
	base: "bg-background rounded-2xl shadow-md p-4 cursor-pointer  w-48 relative",
});

function App() {
	const [inCard, setCount] = useState(true);

	const products: TProduct[] = [
		{
			id: "prod101",
			sku: "VEG-FRZ-102",
			name: "Frozen Mixed Berries",
			description: "A mix of organic frozen berries, 500g.",
			category: ["frozenFruitsAndVegetables"],
			images: [{ src: "https://example.com/images/frozen-berries.jpg" }],
			unit: {
				type: "bag",
				amount: 500,
				divider: 1,
			},
			price: {
				value: 20,
				currency: "ILS",
			},
		},
		{
			id: "prod102",
			sku: "BRD-WHOLE-103",
			name: "Artisan Sourdough Bread",
			description: "Handcrafted sourdough bread, 600g.",
			category: ["breadsAndBakeryProducts"],
			images: [{ src: "https://example.com/images/sourdough-bread.jpg" }],
			unit: {
				type: "loaf",
				amount: 600,
				divider: 1,
			},
			price: {
				value: 25,
				currency: "ILS",
			},
		},
		{
			id: "prod103",
			sku: "CHEESE-GOUDA-104",
			name: "Gouda Cheese",
			description: "Aged Gouda cheese, rich and flavorful, 250g.",
			category: ["dairyAndEggs"],
			images: [{ src: "https://example.com/images/gouda-cheese.jpg" }],
			unit: {
				type: "piece",
				amount: 250,
				divider: 1,
			},
			price: {
				value: 30,
				currency: "ILS",
			},
		},
		{
			id: "prod104",
			sku: "DELI-SALAMI-105",
			name: "Italian Salami",
			description: "Fine Italian salami, great for charcuterie boards, 200g.",
			category: ["delicatessen"],
			images: [{ src: "https://example.com/images/italian-salami.jpg" }],
			unit: {
				type: "pack",
				amount: 200,
				divider: 1,
			},
			price: {
				value: 35,
				currency: "ILS",
			},
		},
		{
			id: "prod105",
			sku: "BEV-COFFEE-106",
			name: "Arabica Coffee Beans",
			description: "Premium Arabica coffee beans, rich in flavor, 500g.",
			category: ["beveragesAndWine"],
			images: [{ src: "https://example.com/images/arabica-coffee.jpg" }],
			unit: {
				type: "bag",
				amount: 500,
				divider: 1,
			},
			price: {
				value: 50,
				currency: "ILS",
			},
		},
		{
			id: "prod106",
			sku: "GROC-OLIVE-OIL-107",
			name: "Organic Olive Oil",
			description: "Cold-pressed organic olive oil, 750ml.",
			category: ["groceryItems"],
			images: [{ src: "https://example.com/images/olive-oil.jpg" }],
			unit: {
				type: "bottle",
				amount: 750,
				divider: 1,
			},
			price: {
				value: 45,
				currency: "ILS",
			},
		},
		{
			id: "prod107",
			sku: "SNCK-CHOC-108",
			name: "Milk Chocolate Bar",
			description: "Smooth and creamy milk chocolate bar, 100g.",
			category: ["snacksAndSweets"],
			images: [{ src: "https://example.com/images/milk-chocolate.jpg" }],
			unit: {
				type: "bar",
				amount: 100,
				divider: 1,
			},
			price: {
				value: 15,
				currency: "ILS",
				discount: {
					type: "percent",
					value: 10,
				},
			},
		},
		{
			id: "prod108",
			sku: "PHARM-SHAMPOO-109",
			name: "Natural Hair Shampoo",
			description: "Eco-friendly hair shampoo with aloe vera, 500ml.",
			category: ["pharmacyHygieneAndBabies"],
			images: [{ src: "https://example.com/images/natural-shampoo.jpg" }],
			unit: {
				type: "bottle",
				amount: 500,
				divider: 1,
			},
			price: {
				value: 40,
				currency: "ILS",
			},
		},
		{
			id: "prod109",
			sku: "CLEAN-DISHSOAP-110",
			name: "Dishwashing Liquid",
			description: "Lemon-scented dishwashing liquid, effective on grease, 750ml.",
			category: ["cleaningMaterials"],
			images: [{ src: "https://example.com/images/dishwashing-liquid.jpg" }],
			unit: {
				type: "bottle",
				amount: 750,
				divider: 1,
			},
			price: {
				value: 25,
				currency: "ILS",
			},
		},
		{
			id: "prod110",
			sku: "HOME-LAMP-111",
			name: "Modern Desk Lamp",
			description: "Stylish and modern desk lamp with LED light, adjustable.",
			category: ["householdUtensilsAndGadgets"],
			images: [{ src: "https://example.com/images/desk-lamp.jpg" }],
			unit: {
				type: "item",
				amount: 1,
				divider: 1,
			},
			price: {
				value: 120,
				currency: "ILS",
				discount: {
					type: "number",
					value: 20,
				},
			},
		},
	];

	const { i18n } = useTranslation();
	const dir = i18n.dir();
	useEffect(() => {
		document.body.dir = dir;
	}, [dir]);

	//  232323
	return (
		<Provider store={store}>
			<Route name="admin">
				<AdminPage />
			</Route>

			<ModalProvider />
			{/* <AddProductPage /> */}
			{/* {routes.map((route) => {
					const Page = route.component;
					return <Page key={route.path} />;
				})} */}
			{/* <AppBar /> */}
			{/* <div className="flex w-full">
					<div className="border flex-shrink-0">
						<SideNavigator />
					</div>
					<div className=" flex-grow p-6 flex flex-wrap justify-center items-start gap-4">
						{products.map((product) => (
							<Product key={product.id} product={product}>
								<Product.Image />
								<div className="flex flex-col gap-1">
									<Product.Name />
									<Product.Description />
									<div className="flex gap-1 text-2xl">
										<Product.Price />
										<Product.Currency />
									</div>

									<Button fullWidth onClick={() => console.log("hi")}>
										Add to cart
									</Button>
									<ButtonGroup className="mt-4 w-full" color="primary">
									<Button isIconOnly> - </Button>
									<Button fullWidth onClick={alert} disabled>
										1
									</Button>
									<Button isIconOnly> + </Button>
								</ButtonGroup>
								</div>
							</Product>
						))}
					</div>
					<div className="w-[400px] border flex-shrink-0">cart</div>
				</div> */}
		</Provider>
	);
}

export default App;
