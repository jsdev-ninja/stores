import { Fragment, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
// import { useAppApi } from "src/appApi";
import { Form } from "src/components/Form";
import { ProductSchema } from "src/domains";
import { TProduct } from "src/domains";
import { TCategory, TFlattenCategory } from "src/domains/Category";
import { useStore } from "src/domains/Store";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";
import { flatten } from "src/utils";
import { FlattenedItem } from "src/widgets/Category/CategoryTree/utils";
import { z } from "zod";

const NewProductSchema = ProductSchema.omit({
	id: true,
	images: true,
	"categories.lvl0": true,
	"categories.lvl1": true,
	"categories.lvl2": true,
	"categories.lvl3": true,
	"categories.lvl4": true,
}).merge(
	z.object({
		images: z.instanceof(File).optional(),
		categories: z.array(TFlattenCategory),
	})
);

export type TNewProduct = z.infer<typeof NewProductSchema>;

const newProductFormSchema = NewProductSchema.extend({}).omit({});

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCategory & FlattenedItem>>([]);

	// const appApi = useAppApi();

	const store = useStore();

	const { t } = useTranslation(["admin", "common"]);

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
				<Form.CategorySelect.Item key={category.id} value={category}>
					{renderParent(category)}
				</Form.CategorySelect.Item>
			</Fragment>
		);
	}

	useEffect(() => {
		if (!store?.id) return;

		FirebaseApi.firestore
			.get<{ id: string; categories: TCategory[] }>(
				store?.id,
				FirebaseApi.firestore.collections.categories
			)
			.then((res) => setCategories(flatten(res.data?.categories ?? [])));
	}, [store?.id]);

	const title = t("admin:addProductPage.title");

	if (!store?.id || !store.companyId) return;

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap flex-col gap-4 mx-auto mt-10  p-4 justify-center"
				schema={newProductFormSchema}
				defaultValues={{
					locales: [{ lang: "he", value: "" }],
					vat: true,
					ingredients: [],
					priceType: {
						type: "unit",
						value: 1,
					},
					currency: "ILS",
					objectID: "",
					categories: [],
					storeId: store.id,
					companyId: store.companyId,
				}}
				onSubmit={async (data) => {
					console.log("SUBMIT", data);

					const { images, ...rest } = data;
					const categories = data.categories as unknown as (TCategory & FlattenedItem)[];

					const categoryProps = {
						lvl0: categories.filter((c) => c.depth === 0).map((c) => c.locales[0].value),
						lvl1: categories.filter((c) => c.depth === 1).map((c) => renderParent(c)),
						lvl2: categories.filter((c) => c.depth === 2).map((c) => c.locales[0].value),
						lvl3: categories.filter((c) => c.depth === 3).map((c) => c.locales[0].value),
						lvl4: categories.filter((c) => c.depth === 4).map((c) => c.locales[0].value),
					};

					const product: Partial<TProduct> = {
						...rest,
						categories: { ...categoryProps },
						images: [],
					};

					if (images) {
						const id = crypto.randomUUID();
						const fileRef = await FirebaseApi.storage.upload(id, images);
						product.images = [{ id: id, url: fileRef.url }];
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
					<Form.Input name="sku" label={t("common:sku")} placeholder={t("common:sku")} />
					<Form.ErrorMessage<TNewProduct> name="sku" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="description"
						label={t("common:description")}
						placeholder={t("common:description")}
					/>
				</div>

				<div className="my-4">
					<Form.Input<TNewProduct>
						name="price"
						label={t("common:price")}
						placeholder={t("common:price")}
						type="number"
					/>
				</div>
				<div className="my-4">
					<Form.CategorySelect<TNewProduct>
						multiple
						displayValue={(categories: any) => categories.map((c: any) => c.tag).join(", ")}
						name="categories"
						placeholder={t("common:selectCategory")}
						categories={categories ?? []}
						label={t("common:category")}
					>
						{categories.map(renderCategory)}
					</Form.CategorySelect>
				</div>
				<div className="my-4 flex items-center gap-2">
					<label htmlFor="">{t("common:priceType")}</label>
					<div className="w-44">
						<Form.Select<TNewProduct>
							name="priceType.type"
							placeholder={t("common:enterPriceType")}
						>
							<Form.Select.Item value="unit">{t("common:unit")}</Form.Select.Item>
							<Form.Select.Item value="kg">{t("common:kg")}</Form.Select.Item>
							<Form.Select.Item value="gram">{t("common:gram")}</Form.Select.Item>
						</Form.Select>
					</div>
					<div className="w-32">
						<Form.Input<TNewProduct> type="number" name="priceType.value" />
					</div>
				</div>
				<div className="my-4">
					<Form.Checkbox<TNewProduct> name="vat" label={t("common:vat")} />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="brand"
						label={t("common:brand")}
						placeholder={t("common:brand")}
					/>
					<Form.ErrorMessage<TNewProduct> name="brand" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="manufacturer"
						label={t("common:manufacturer")}
						placeholder={t("common:manufacturer")}
					/>
					<Form.ErrorMessage<TNewProduct> name="manufacturer" />
				</div>
				<div className="my-4">
					<Form.Input<TNewProduct>
						name="supplier"
						label={t('common:supplier')}
						placeholder={t('common:supplier')}
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
	const { t } = useTranslation(["common"]);

	return (
		<div className="">
			<div className="flex gap-4">
				<Form.Input<TNewProduct> disabled name={`locales[0].lang`} label={t("lang")} />
				<div className="flex flex-col gap-1">
					<Form.Input<TNewProduct>
						name={`locales[0].value`}
						label={t("name")}
						placeholder={t("editProductName")}
					/>
					<Form.ErrorMessage<TNewProduct> name="locales[0].value" />
				</div>
			</div>
		</div>
	);
}
