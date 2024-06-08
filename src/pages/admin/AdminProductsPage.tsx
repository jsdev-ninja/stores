import { useEffect, useState } from "react";
import { Button } from "src/components/Button/Button";
import { TProduct } from "src/domains";
import { FirebaseApi } from "src/lib/firebase";
import { Link } from "src/navigation";
import { Product } from "src/widgets/Product";
import { Products } from "src/widgets/Products";

export function AdminProductsPage() {
	const [products, setCategories] = useState<Array<TProduct>>([]);
	// useEffect(() => {
	// 	FirebaseApi.firestore
	// 		.list(FirebaseApi.firestore.collections.products)
	// 		.then((res) => setCategories(res.data ?? []));
	// }, []);

	console.log("products", products);

	return (
		<div className="">
			<div className="shadow p-4">
				<Link to="admin.addProduct">add product</Link>
			</div>

			<Products></Products>

			<div className="flex gap-4 flex-wrap mt-4">
				{products.map((product) => {
					return (
						<Product key={product.id} product={product}>
							<div className="shadow w-80 p-4 flex flex-col ">
								<div className="h-40 w-40 mx-auto">
									<Product.Image />
								</div>
								<div className="my-4">
									<Product.Name />
								</div>
								<div className="flex gap-4 justify-center my-4">
									<Button fullWidth>Edit</Button>
									<Button fullWidth>Delete</Button>
								</div>
							</div>
						</Product>
					);
				})}
			</div>
		</div>
	);
}
