import { Button } from "src/components/Button/Button";
import { navigate } from "src/navigation";

import { Products, ProductsSearch, ProductsWidget } from "src/widgets/Products";

export function AdminProductsPage() {
	return (
		<ProductsWidget>
			<div className="">
				<div className="shadow p-4 flex items-center gap-4">
					<div className="flex-grow">
						<ProductsSearch />
					</div>
					<Button onClick={() => navigate("admin.addProduct")}>Create Product</Button>
				</div>

				<div className="flex">
					<div className="shadow border flex-grow">
						<Products></Products>
					</div>
					<div className="shadow w-80 shrink-0">sidebar</div>
				</div>
			</div>
		</ProductsWidget>
	);
}
