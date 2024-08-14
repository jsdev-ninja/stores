import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { ProductSchema, TProduct } from "src/domains";
import { TCategory } from "src/domains/Category";
import { ProductService } from "src/domains/product/productService";
import { FirebaseApi } from "src/lib/firebase";
import { navigate, useParams } from "src/navigation";
import { z } from "zod";

export const NewProductSchema = ProductSchema.omit({}).merge(
	z.object({
		newImage: z.instanceof(File).optional(),
	})
);

type TNewProduct = z.infer<typeof NewProductSchema>;

export function EditProductPage() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);

	const { t } = useTranslation(["admin", "common"]);

	const params = useParams("admin.editProduct");

	const [product, setProduct] = useState<TProduct | null>(null);

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

	const title = t("admin:productForm.edit.title");

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap flex-col gap-4 mx-auto mt-10  p-4 justify-center"
				schema={NewProductSchema}
				defaultValues={product ?? undefined}
				onSubmit={async (data) => {
					const { categories: formCategories, images, newImage, ...rest } = data;

					const product: Partial<TProduct> = {
						...rest,
					};

					if (newImage) {
						const fileRef = await FirebaseApi.storage.upload("image.png", newImage);

						if (images?.[0]) {
							await FirebaseApi.storage.remove(images?.[0].url);
						}
						product.images = [{ id: crypto.randomUUID(), url: fileRef.url }];
					}
					// product = { ...product, ...data };

					await FirebaseApi.firestore.update(
						product.id ?? "",
						product,
						FirebaseApi.firestore.collections.products
					);

					navigate({ to: "admin.products" });
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
					<Form.Input<TNewProduct>
						name="price"
						label="Price"
						placeholder="Enter product price"
						type="number"
					/>
				</div>
				<div className="my-4">
					<Form.Select<TNewProduct>
						multiple
						displayValue={(categories: any[]) => categories.map((c: any) => c.tag).join(", ")}
						name="categories"
						placeholder={"select category"}
					>
						{categories.map((category) => (
							<Form.Select.Item
								key={category.id}
								value={{ id: category.id, tag: category.tag }}
							>
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
				<div className="my-4 flex flex-col gap-4">
					<Form.File<TNewProduct> name="newImage" label="Product image" />
					<ImagePreview productImage={product.images[0]} />
				</div>
				<div className="my-8">
					<Form.Submit>Add product</Form.Submit>
				</div>
			</Form>
		</div>
	);
}

function ImagePreview({ productImage }: { productImage: any }) {
	const form = useFormContext();
	const newImage = form.watch("newImage");

	// newImage ? URL.createObjectURL(images) :
	const url = newImage ? URL.createObjectURL(newImage) : productImage ? productImage.url : null;

	return <div className="h-40 w-40">{url && <img src={url} className="" alt="" />}</div>;
}

function NameDetails() {
	return (
		<div className="">
			<Form.Input<TNewProduct>
				name={`locales[0].value`}
				label={"Name"}
				placeholder="Enter product name"
			/>
		</div>
	);
}
