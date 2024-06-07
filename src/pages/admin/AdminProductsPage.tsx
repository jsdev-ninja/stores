import { useEffect, useState } from "react";
import { TProduct } from "src/domains";
import { FirebaseApi } from "src/lib/firebase";
import { Link } from "src/navigation";

export function AdminProductsPage() {
	const [products, setCategories] = useState<Array<TProduct>>([]);
	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.products)
			.then((res) => setCategories(res.data ?? []));
	}, []);

	return (
		<div className="">
			<table>
				<thead>
					<tr className="border">
						<td>name</td>
						<td>sku</td>
						<td>price</td>
					</tr>
				</thead>
				<tbody>
					{products.map((product) => {
						return (
							<tr className="border" key={product.id}>
								<td>{product.sku}</td>
								<td>{'product.name'}</td>
								<td>
									{product.price}
									{product.currency}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<Link to="admin.addProduct">add product</Link>
		</div>
	);
}
