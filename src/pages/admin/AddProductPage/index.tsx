import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { NewProductSchema } from "src/domains";
import type { TNewProduct, TProduct } from "src/domains";
import { TCategory } from "src/domains/Category";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);

	const { t } = useTranslation(["admin", "common"]);

	console.log("categories.categories", categories);

	const rootCategories = categories.filter((c) => !c.parentId);

	console.log("rootCategories", rootCategories);

	useEffect(() => {
		FirebaseApi.firestore
			.list(FirebaseApi.firestore.collections.categories)
			.then((res) => setCategories(res.data ?? []));
	}, []);

	const title = t("admin:productForm.add.title");

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap flex-col gap-4 mx-auto mt-10  p-4 justify-center"
				schema={NewProductSchema}
				defaultValues={{
					locales: [{ lang: "he" }],
					vat: false,
					ingredients: [],
					unit: {
						type: "unit",
						value: 1,
					},
					currency: "ILS",
					images: undefined,
				}}
				onSubmit={async (data) => {
					console.log("SUBMIT", data);

					const { images, ...rest } = data;

					const product: Partial<TProduct> = {
						...rest,
					};

					if (images) {
						console.log("images", images, 1);

						const fileRef = await FirebaseApi.storage.upload("image.png", images);
						product.images = [{ id: crypto.randomUUID(), url: fileRef.url }];
					}

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
					<Form.ErrorMessage<TNewProduct> name="sku" />
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
						displayValue={(categories: any) => categories.map((c: any) => c.tag).join(", ")}
						name="categories"
						placeholder={"select category"}
					>
						{rootCategories.map((category) => {
							const sub = categories.filter((c) => c.parentId === category.id);
							return (
								<>
									<Form.Select.Item
										key={category.id}
										value={{ id: category.id, tag: category.tag }}
									>
										{category.locales[0].value}
									</Form.Select.Item>
									{sub.map((subCategory) => {
										return (
											<>
												<Form.Select.Item
													key={subCategory.id}
													value={{ id: subCategory.id, tag: subCategory.tag }}
												>
													({category.locales[0].value}) {subCategory.locales[0].value}
												</Form.Select.Item>
											</>
										);
									})}
								</>
							);
						})}
					</Form.Select>
				</div>
				<div className="my-4 flex items-center gap-2">
					<label htmlFor="">unit type</label>
					<div className="w-44">
						<Form.Select<TNewProduct> name="unit.type" placeholder={"select unit"}>
							<Form.Select.Item value="unit">unit</Form.Select.Item>
							<Form.Select.Item value="kg">kg</Form.Select.Item>
							<Form.Select.Item value="gram">gram</Form.Select.Item>
						</Form.Select>
					</div>
					<div className="w-32">
						<Form.Input<TNewProduct> type="number" name="unit.value" />
					</div>
				</div>
				<div className="my-4">
					<Form.Checkbox<TNewProduct> name="vat" label="Vat" />
				</div>
				<div className="my-4 flex flex-col gap-4">
					<Form.File<TNewProduct> name="images" label="Product image" />
					<ImagePreview />
				</div>
				<div className="my-4">
					<Form.Submit>Add product</Form.Submit>
				</div>
			</Form>
		</div>
	);
}

function ImagePreview() {
	const form = useFormContext();
	const images = form.watch("images");

	console.log("images.images", images);

	const url = images ? URL.createObjectURL(images) : null;
	console.log("url", url);

	return <div className="h-40 w-40">{url && <img src={url} className="" alt="" />}</div>;
}

function NameDetails() {
	return (
		<div className="">
			<div className="flex gap-4">
				<Form.Input<TNewProduct> name={`locales[0].lang`} label={"Lang"} />
				<div className="flex flex-col gap-1">
					<Form.Input<TNewProduct>
						name={`locales[0].value`}
						label={"Name"}
						placeholder="Enter product name"
					/>
					<Form.ErrorMessage<TNewProduct> name="locales[0].value" />
				</div>
			</div>
		</div>
	);
}
