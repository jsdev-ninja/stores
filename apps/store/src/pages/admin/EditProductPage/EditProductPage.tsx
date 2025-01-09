import { EditProductSchema, ProductSchema, TEditProduct, TProduct } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Flex } from "src/components/Flex";
import { Form } from "src/components/Form";
import { CategoryService, TCategory, TFlattenCategory } from "src/domains/Category";
import { useStore } from "src/domains/Store";
import { ProductService } from "src/domains/product/productService";
import { FirebaseApi } from "src/lib/firebase";
import { navigate, useParams } from "src/navigation";
import { flatten } from "src/utils/flatten";
import { FlattenedItem } from "src/widgets/Category/CategoryTree/utils";
import { z } from "zod";

export const NewProductSchema = ProductSchema.omit({}).merge(
	z.object({
		newImage: z.instanceof(File).optional(),
		purchasePrice: z.number().optional(),
		profitPercentage: z.number().optional(),
	})
);

type TNewProduct = z.infer<typeof NewProductSchema>;

function isValidValue(number: number): boolean {
	return !isNaN(number) && number > 0;
}

function PriceSection() {
	const form = useFormContext<TNewProduct>();

	const { t } = useTranslation(["admin", "common"]);

	const purchasePrice = form.watch("purchasePrice") ?? 0;
	const profitPercentage = form.watch("profitPercentage") ?? 0;

	useEffect(() => {
		if (isValidValue(profitPercentage ?? 0) && isValidValue(purchasePrice ?? 0)) {
			const result = purchasePrice / ((100 - profitPercentage) / 100);
			const fixed = result.toFixed(2);
			form.setValue("price", parseFloat(fixed));
		}
	}, [profitPercentage, purchasePrice]);

	return (
		<Flex gap={"4"} wrap align={"start"}>
			<Flex.Item grow="none" className="h-full">
				<Form.Checkbox<TEditProduct> name="vat" label={t("common:vat")} />
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TEditProduct>
					name="price"
					label={t("common:price")}
					placeholder={t("common:price")}
					type="number"
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TEditProduct>
					name="purchasePrice"
					label={t("common:purchasePrice")}
					placeholder={t("common:purchasePrice")}
					type="number"
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TEditProduct>
					name="profitPercentage"
					label={t("common:profitPercentage")}
					placeholder={t("common:profitPercentage")}
					type="number"
				/>
			</Flex.Item>
		</Flex>
	);
}

export function EditProductPage() {
	const [categories, setCategories] = useState<Array<TCategory & FlattenedItem>>([]);

	const { t } = useTranslation(["admin", "common"]);

	const store = useStore();

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
		if (!store?.id) return;
		CategoryService.list(store.id).then((items) => setCategories(flatten(items)));
	}, [store?.id]);

	function renderParent(category: TCategory, categories: TFlattenCategory[]): string {
		if (!category) return "";

		const parent = category.parentId
			? categories.find((c) => c.id === category.parentId)
			: undefined;

		const sign = parent ? " > " : "";

		if (!parent) return `${category.locales[0].value}`;

		return `${renderParent(parent, categories)}${sign}${category.locales[0].value}`;
	}

	function renderCategory(category: TCategory & FlattenedItem) {
		return (
			<Form.CategorySelect.Item key={category.id} value={category}>
				{renderParent(category, categories)}
			</Form.CategorySelect.Item>
		);
	}

	if (!product) return;

	const title = t("admin:productForm.edit.title");

	console.log(product);

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TEditProduct>
				className="flex flex-wrap shadow flex-col gap-4 mx-auto mt-10  p-4 justify-center max-w-screen-md"
				schema={EditProductSchema}
				defaultValues={
					product ? { ...product, profitPercentage: 0, purchasePrice: 0 } : undefined
				}
				onSubmit={async (data) => {
					const {
						categories: formCategories,
						images,
						image,
						profitPercentage,
						purchasePrice,
						...rest
					} = data;

					const product: Partial<TProduct> = {
						...rest,
					};

					if (image) {
						const fileRef = await FirebaseApi.storage.upload("image.png", image);

						if (images?.[0]) {
							await FirebaseApi.storage.remove(images?.[0].url);
						}
						product.images = [{ id: crypto.randomUUID(), url: fileRef.url }];
					}
					const categories = flatten(data.categoryList);

					const categoryProps = {
						lvl0: categories
							.filter((c) => c.depth === 0)
							.map((c) => renderParent(c, categories)),
						lvl1: categories
							.filter((c) => c.depth === 1)
							.map((c) => renderParent(c, categories)),
						lvl2: categories
							.filter((c) => c.depth === 2)
							.map((c) => renderParent(c, categories)),
						lvl3: categories
							.filter((c) => c.depth === 3)
							.map((c) => renderParent(c, categories)),
						lvl4: categories
							.filter((c) => c.depth === 4)
							.map((c) => renderParent(c, categories)),
					};
					product.categories = categoryProps;

					await FirebaseApi.firestore.update(
						product.id ?? "",
						product,
						FirebaseApi.firestore.collections.products
					);

					navigate({ to: "admin.products" });
				}}
			>
				<NameDetails />

				<Flex>
					<Form.TextArea<TEditProduct>
						name="description"
						label={t("common:description")}
						placeholder={t("common:description")}
					/>
				</Flex>
				<Flex className="flex" gap={"4"} align={"start"}>
					<Flex.Item>
						<Form.Select<TEditProduct>
							name="priceType.type"
							placeholder={t("common:enterPriceType")}
							label={t("common:priceType")}
						>
							<Form.Select.Item value="unit">{t("common:unit")}</Form.Select.Item>
							<Form.Select.Item value="kg">{t("common:kg")}</Form.Select.Item>
							<Form.Select.Item value="gram">{t("common:gram")}</Form.Select.Item>
							<Form.Select.Item value="liter">{t("common:liter")}</Form.Select.Item>
							<Form.Select.Item value="ml">{t("common:ml")}</Form.Select.Item>
						</Form.Select>
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TEditProduct>
							type="number"
							name="priceType.value"
							label={t("common:amount")}
							placeholder={t("common:amount")}
						/>
					</Flex.Item>
				</Flex>

				<PriceSection />

				<Flex wrap gap={"4"} align={"end"}>
					<Flex.Item>
						<Form.Select<TEditProduct>
							label={t("common:weight")}
							name="weight.unit"
							placeholder={t("common:weight")}
						>
							<Form.Select.Item value="none">{t("common:none")}</Form.Select.Item>
							<Form.Select.Item value="kg">{t("common:kg")}</Form.Select.Item>
							<Form.Select.Item value="gram">{t("common:gram")}</Form.Select.Item>
						</Form.Select>
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TEditProduct> type="number" name="weight.value" />
					</Flex.Item>
				</Flex>
				<Flex wrap gap={"4"} align={"end"}>
					<Flex.Item>
						<Form.Select<TEditProduct>
							label={t("common:volume")}
							name="volume.unit"
							placeholder={t("common:volume")}
						>
							<Form.Select.Item value="none">{t("common:none")}</Form.Select.Item>
							<Form.Select.Item value="liter">{t("common:liter")}</Form.Select.Item>
							<Form.Select.Item value="ml">{t("common:ml")}</Form.Select.Item>
						</Form.Select>
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TEditProduct> type="number" name="volume.value" />
					</Flex.Item>
				</Flex>
				<Flex>
					<Flex.Item>
						<Form.CategorySelect<TEditProduct>
							multiple
							displayValue={(categories: any) =>
								categories.map((c: any) => c.locales[0].value).join(", ")
							}
							name="categoryList"
							placeholder={t("common:selectCategory")}
							categories={categories ?? []}
							label={t("common:category")}
						>
							{categories.map(renderCategory)}
						</Form.CategorySelect>
					</Flex.Item>
				</Flex>

				<Flex gap={"4"} wrap>
					<Flex.Item>
						<Form.Input<TEditProduct>
							name="brand"
							label={t("common:brand")}
							placeholder={t("common:brand")}
						/>
						<Form.ErrorMessage<TEditProduct> name="brand" />
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TEditProduct>
							name="manufacturer"
							label={t("common:manufacturer")}
							placeholder={t("common:manufacturer")}
						/>
						<Form.ErrorMessage<TEditProduct> name="manufacturer" />
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TEditProduct>
							name="supplier"
							label={t("common:supplier")}
							placeholder={t("common:supplier")}
						/>
						<Form.ErrorMessage<TEditProduct> name="supplier" />
					</Flex.Item>
				</Flex>
				<div className="my-4 flex flex-col gap-4">
					<Form.File<TEditProduct> name="image" label="Product image" />
					<ImagePreview productImage={product.images?.[0]} />
				</div>
				<div className="my-4">
					<Form.Submit>Add product</Form.Submit>
				</div>
			</Form>
		</div>
	);
}

function ImagePreview({ productImage }: { productImage?: any }) {
	const form = useFormContext();
	const newImage = form.watch("newImage");

	// newImage ? URL.createObjectURL(images) :
	const url = newImage ? URL.createObjectURL(newImage) : productImage ? productImage.url : null;

	return <div className="h-40 w-40">{url && <img src={url} className="" alt="" />}</div>;
}

function NameDetails() {
	const { t } = useTranslation(["common"]);

	return (
		<Flex wrap gap={"4"} align={"start"}>
			<Flex.Item>
				<Form.Input<TEditProduct>
					name={`name[0].value`}
					label={t("name")}
					placeholder={t("editProductName")}
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input name="sku" label={t("common:sku")} placeholder={t("common:sku")} />
			</Flex.Item>
		</Flex>
	);
}
