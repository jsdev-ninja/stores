import { useEffect, useState } from "react";
import { Button } from "src/components/Button/Button";
import { TProduct } from "src/domains";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { Product } from "src/widgets/Product";
import { SideNavigator } from "src/widgets/SideNavigator";

export function CatalogPage() {
	const [products, setProducts] = useState<Array<TProduct>>([]);
	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.products)
			.then((res) => setProducts(res.data));
	}, []);
	console.log("products", products);

	const p: TProduct = {
		id: "1",
		sku: "11",
		name: "Natural nuts tray",
		description: "lorem impsum more..",
		vat: true,
		price: 200,
		currency: "ILS",
		discount: {
			value: 10,
			type: "percent",
		},
		weight: {
			unit: "gram",
			value: 190,
		},
		images: [
			{
				id: "1",
				url: "https://yastatic.net/avatars/get-grocery-goods/2791769/2a054b2d-3628-41c3-adf7-563d7f6ce6cb/600x600?webp=true",
			},
		],
		unit: { type: "gram", value: 190 },
	};

	let ps = [p];
	return (
		<div className="flex w-full h-full">
			<div className="flex-shrink-0  overflow-auto h-full">
				<SideNavigator />
			</div>
			<div className=" flex-grow p-6 flex flex-wrap justify-center items-start gap-4">
				{ps.map((product) => (
					<Product key={product.id} product={product}>
						<Product.Image size="lg" />
						<div className="flex flex-col gap-1 mt-4">
							<Product.Name />
							<div className="flex gap-1">
								<Product.Price />
							</div>

							<div className="">
								<Product.Weight />
							</div>

							<div className="mt-6 w-full">
								<Product.CartButton size="md" />
							</div>
						</div>
					</Product>
				))}
			</div>
			<div className="w-[500px] flex flex-col  flex-shrink-0">
				<Cart />
				<div className="p-4">
					<Button fullWidth onClick={() => navigate("store.cart")}>
						Go to cart
					</Button>
				</div>
			</div>
		</div>
	);
}
