import { useEffect, useState } from "react";
import { Form } from "src/components/Form";
import { NewProductSchema, TNewProduct, TProduct } from "src/domains";
import { TCompany } from "src/domains/Company";
import { ProductService } from "src/domains/product/productService";
import { FirebaseApi } from "src/lib/firebase";
import { navigate, useParams } from "src/navigation";

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCompany>>([]);

	const params = useParams("admin.editProduct");
	console.log("params", params.id);

	const [product, setProduct] = useState<TProduct | null>(null);
	console.log("product", product);

	useEffect(() => {
		if (params.id) {
			ProductService.get(params.id).then((response) => {
				if (response.success) {
					setProduct(response.data);
				}
			});
		}
	}, [params.id]);

	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.categories)
			.then((res) => setCategories(res.data ?? []));
	}, []);

	if (!product) return;

	return (
		<div className="">
			<Form<TNewProduct>
				className="flex flex-wrap gap-4 mx-auto mt-10  p-4 justify-center items-center"
				schema={NewProductSchema}
				defaultValues={product}
				onSubmit={async (data: TNewProduct) => {
					if (!data.image) return;

					console.log("SUBMIT", data);
					return;

					const fileRef = await FirebaseApi.storage.upload("image.png", data.image[0]);

					let product: Partial<TProduct> = {
						images: [{ id: crypto.randomUUID(), url: fileRef.url }],
					};

					delete data["image"];

					product = { ...product, ...data };

					const res = await FirebaseApi.firestore.create(
						product,
						FirebaseApi.firestore.collections.products
					);

					navigate("admin.products");
				}}
			>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="locales[0].value"
						label="Name"
						placeholder="Enter product name"
					/>
				</div>
				<div className="my-4">
					<Form.Input name="sku" label="Sku" placeholder="Enter product sku" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
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
					<Form.Select name="category" placeholder={"select category"}>
						{categories.map((category) => (
							<Form.Select.Item key={category.id} value={category.id}>
								{category.name}
							</Form.Select.Item>
						))}
					</Form.Select>
				</div>
				<div className="my-4">
					<Form.Select name="unit.type" placeholder={"select unit"}>
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
	);
}
