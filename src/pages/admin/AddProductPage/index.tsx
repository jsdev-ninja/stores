import { Fragment, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { NewProductSchema } from "src/domains";
import { TProduct } from "src/domains";
import { CategorySchema, TCategory } from "src/domains/Category";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";
import { flatten } from "src/utils";
import { FlattenedItem } from "src/widgets/Category/CategoryTree/utils";
import { z } from "zod";

const newProductFormSchema = NewProductSchema.extend({
	categories: z.array(CategorySchema),
}).omit({
	"categories.lvl0": true,
	"categories.lvl1": true,
	"categories.lvl2": true,
	"categories.lvl3": true,
	"categories.lvl4": true,
});

type TNewProduct = z.infer<typeof newProductFormSchema>;

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCategory & FlattenedItem>>([]);

	const { t } = useTranslation(["admin", "common"]);

	console.log("categories.categories", categories);

	const rootCategories = categories.filter((c) => !c.parentId);

	console.log("rootCategories", rootCategories);

	function renderParent(category?: TCategory): string {
		if (!category) return "";

		const parent = category.parentId
			? categories.find((c) => c.id === category.parentId)
			: undefined;

		const sign = parent ? " > " : "";

		return `${renderParent(parent)}${sign}${category.locales[0].value}`;
	}

	function renderCategory(category: TCategory & FlattenedItem) {
		return (
			<Fragment key={category.id}>
				<Form.Select.Item key={category.id} value={category}>
					{renderParent(category)}
				</Form.Select.Item>
			</Fragment>
		);
	}

	useEffect(() => {
		FirebaseApi.firestore
			.get("dhXXgvpn1wyTfqxoQfr0", FirebaseApi.firestore.collections.categories)
			.then((res) => setCategories(flatten(res.data.categories) ?? []));
	}, []);

	const title = t("admin:productForm.add.title");

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap flex-col gap-4 mx-auto mt-10  p-4 justify-center"
				// schema={newProductFormSchema}
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
					objectID: "",
				}}
				onSubmit={async (data) => {
					console.log("SUBMIT", data);

					const { images, ...rest } = data;
					const categories = data.categories as unknown as (TCategory & FlattenedItem)[];

					console.log("categories", categories);

					const categoryProps = {
						lvl0: categories.filter((c) => c.depth === 0).map((c) => c.locales[0].value),
						lvl1: categories.filter((c) => c.depth === 1).map((c) => renderParent(c)),
						lvl2: categories.filter((c) => c.depth === 2).map((c) => c.locales[0].value),
						lvl3: categories.filter((c) => c.depth === 3).map((c) => c.locales[0].value),
						lvl4: categories.filter((c) => c.depth === 4).map((c) => c.locales[0].value),
					};

					console.log("categoryProps", categoryProps);

					const product: Partial<TProduct> = {
						...rest,
						hierarchicalCategories: categoryProps,
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
						{categories.map(renderCategory)}
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
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="brand"
						label="brand"
						placeholder="Enter product brand"
					/>
					<Form.ErrorMessage<TNewProduct> name="brand" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="manufacturer"
						label="manufacturer"
						placeholder="Enter product manufacturer"
					/>
					<Form.ErrorMessage<TNewProduct> name="manufacturer" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="supplier"
						label="supplier"
						placeholder="Enter product supplier"
					/>
					<Form.ErrorMessage<TNewProduct> name="supplier" />
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
