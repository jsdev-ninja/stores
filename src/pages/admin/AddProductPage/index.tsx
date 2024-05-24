import { Form } from "src/components/Form";
import { NewProductSchema, ProductSchema, TNewProduct } from "src/domains";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";

export function AddProductPage() {
	return (
		<div className="">
			<div className="flex flex-col gap-4 w-[500px] mx-auto mt-10 shadow p-4">
				<Form
					schema={NewProductSchema}
					onSubmit={(data: TNewProduct) => {
						console.log("WORK", data);
						navigate("admin");
						// FirebaseApi.firestore.create(data, FirebaseApi.firestore.collections.products);
					}}
					defaultValues={{
						currency: "ILS",
						vat: false,
						images: [],
					}}
				>
					<div className="my-4">
						<Form.Input name="name" label="Name" placeholder="Enter product name" />
					</div>
					<div className="my-4">
						<Form.Input name="sku" label="Sku" placeholder="Enter product sku" />
					</div>
					<div className="my-4">
						<Form.Input
							name="description"
							label="Description"
							placeholder="Enter product description"
						/>
					</div>
					<div className="my-4">
						<Form.Input
							name="price"
							label="Price"
							placeholder="Enter product price"
							type="number"
						/>
					</div>
					<div className="my-4">
						<Form.Select name="unit.type" placeholder={"select"}>
							<Form.Select.Item value="unit">unit</Form.Select.Item>
							<Form.Select.Item value="kg">kg</Form.Select.Item>
							<Form.Select.Item value="gram">gram</Form.Select.Item>
						</Form.Select>
					</div>
					<div className="my-4">
						<Form.Checkbox name="vat" label="Vat" />
					</div>
					<div className="my-4">
						<Form.File name="image" label="Product image" />
					</div>
					<div className="my-4">
						<Form.Submit>Add product</Form.Submit>
					</div>
				</Form>
			</div>
		</div>
	);
}
