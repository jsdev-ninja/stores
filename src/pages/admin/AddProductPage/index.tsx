import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { NewProductSchema, TNewProduct, TProduct } from "src/domains";
import { TCategory } from "src/domains/Category";
import { ProductService } from "src/domains/product/productService";
import { FirebaseApi } from "src/lib/firebase";
import { navigate, useParams } from "src/navigation";

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);

	const { t } = useTranslation(["admin", "common"]);

	const params = useParams("admin.editProduct");

	const [product, setProduct] = useState<TProduct | null>(null);

	const isNewProductFlow = !params.id;

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

	if (!product && !isNewProductFlow) return;

	const title = isNewProductFlow
		? t("admin:productForm.add.title")
		: t("admin:productForm.edit.title");

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap flex-col gap-4 mx-auto mt-10  p-4 justify-center"
				schema={NewProductSchema}
				defaultValues={product}
				onSubmit={async (data: TNewProduct) => {
					if (!data.images) return;

					console.log("SUBMIT", data);

					const fileRef = await FirebaseApi.storage.upload("image.png", data.images[0]);

					const product: Partial<TProduct> = {
						images: [{ id: crypto.randomUUID(), url: fileRef.url }],
					};

					delete data["images"];

					// product = { ...product, ...data };

					const res = await FirebaseApi.firestore.create(
						product,
						FirebaseApi.firestore.collections.products
					);

					console.log("res", res);

					navigate("admin.products");
				}}
			>
				<div className="my-4">
					<NameDetails />
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
								{category.locales[0].value}
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
					<Form.Checkbox<TNewProduct> name="vat" label="Vat" />
				</div>
				<div className="my-4">
					<Form.File<TNewProduct> name="images" label="Product image" />
				</div>
				<div className="my-4">
					<Form.Submit>Add product</Form.Submit>
				</div>
			</Form>
		</div>
	);
}

function NameDetails() {
	const form = useFormContext();

	const locales = form.watch("locales") as TNewProduct["locales"];

	return (
		<div className="">
			{locales.map((locale, index) => (
				<Form.Input<TNewProduct>
					name={`locales[${index}].value`}
					label={locale.lang}
					placeholder="Enter product name"
				/>
			))}
		</div>
	);
}
