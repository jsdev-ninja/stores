import { NewProductSchema, storeCalculator, TCategory, TNewProduct, TProduct } from "@jsdev_ninja/core";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { FileUpload } from "src/components/FIleUpload/FileUpload";
import { Flex } from "src/components/Flex";
import { Form } from "src/components/Form";
import { TFlattenCategory } from "src/domains/Category";
import { useStore } from "src/domains/Store";
import { navigate, useParams } from "src/navigation";
import { flatten } from "src/utils/flatten";
import { FlattenedItem } from "src/widgets/Category/CategoryTree/utils";



function PriceSection() {
	const form = useFormContext<TNewProduct>();

	const { t } = useTranslation(["admin", "common"]);

	const price = form.watch("price") ?? 0;
	const purchasePrice = form.watch("purchasePrice") ?? 0;
	const profitPercentage = form.watch("profitPercentage") ?? 0;

	const vat = form.watch("vat") ?? false;


	const purchasePriceWithVat = vat ? purchasePrice * 1.18 : purchasePrice;


	console.log("AAAAA", form.watch('price'))



	return (
		<Flex gap={"4"} wrap align={"start"}>
			<Flex.Item grow="none" className="h-full">
				<Form.Checkbox<TNewProduct> name="vat" label={t("common:vat")} />
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="price"
					label={t("common:price")}
					placeholder={t("common:price")}
					type="number"
					onChange={(value) => {
						console.log("value", value);
						if (purchasePrice > 0) {
							const margin = storeCalculator.calcMarginFromSalePrice(+value, purchasePriceWithVat);
							form.setValue("profitPercentage", margin);
						}
					}}
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="purchasePrice"
					label={t("common:purchasePrice")}
					placeholder={t("common:purchasePrice")}
					type="number"
					onChange={(value) => {
						if (+value > 0 && price > 0) {
							const margin = storeCalculator.calcMarginFromSalePrice(price, vat ? (+value) * 1.18 : +value);
							form.setValue("profitPercentage", margin);
						}
					}}
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="profitPercentage"
					label={t("common:profitPercentage")}
					placeholder={t("common:profitPercentage")}
					type="number"
					onChange={(value) => {
						if (+value > 0 && profitPercentage > 0) {
							const newPrice = storeCalculator.calcSalePriceFromMargin(+value, purchasePriceWithVat);
							form.setValue("price", newPrice);
						}
					}}
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
	console.log("product", product);

	const appApi = useAppApi();

	useEffect(() => {
		if (params.id) {
			appApi.system.getProductById({ id: params.id }).then((response) => {
				if (response?.success) {
					setProduct(response.data);
				}
			});
		}
	}, [params.id]);

	useEffect(() => {
		if (!store?.id) return;
		appApi.system
			.getStoreCategories()
			.then((items) => setCategories(flatten(items?.data?.categories ?? [])));
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
			<Form.CategorySelect.Item key={category.id} value={category.id}>
				{renderParent(category, categories)}
			</Form.CategorySelect.Item>
		);
	}

	if (!product) return;

	const title = t("admin:productForm.edit.title");

	const flattenCategory = flatten(categories);

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap shadow flex-col gap-4 mx-auto mt-10  p-4 justify-center max-w-screen-md"
				schema={NewProductSchema}
				defaultValues={product}
				onSubmit={async (data) => {
					await appApi.admin.saveProduct(data);

					navigate({ to: "admin.products", state: window.history.state });
				}}
				onError={(err) => console.log(err)}
			>
				<NameDetails />

				<Flex.Item grow="none" className="h-full">
					<Form.Checkbox<TNewProduct> name="isPublished" label={"קיים במלאי"} />
				</Flex.Item>

				<Flex.Item grow="none" className="h-full">
					<Form.Checkbox<TNewProduct> name="isDiscountable" label={"בר הנחה"} />
				</Flex.Item>

				<Flex>
					<Form.TextArea<TNewProduct>
						name="description[0].value"
						label={t("common:description")}
						placeholder={t("common:description")}
					/>
				</Flex>
				<Flex className="flex" gap={"4"} align={"start"}>
					<Flex.Item>
						<Form.Select<TNewProduct>
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
						<Form.Input<TNewProduct>
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
						<Form.Select<TNewProduct>
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
						<Form.Input<TNewProduct> type="number" name="weight.value" />
					</Flex.Item>
				</Flex>
				<Flex wrap gap={"4"} align={"end"}>
					<Flex.Item>
						<Form.Select<TNewProduct>
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
						<Form.Input<TNewProduct> type="number" name="volume.value" />
					</Flex.Item>
				</Flex>
				<Flex>
					<Flex.Item>
						<Form.CategorySelect<TNewProduct>
							multiple
							displayValue={(categories: string[]) => {
								return categories.map((id) => {
									const category = flattenCategory.find((c) => c.id === id);
									return category?.locales[0].value;
								});
								// categories.map((c: any) => c.locales[0].value).join(", ")
							}}
							name="categoryIds"
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
						<Form.Input<TNewProduct>
							name="brand"
							label={t("common:brand")}
							placeholder={t("common:brand")}
						/>
						<Form.ErrorMessage<TNewProduct> name="brand" />
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TNewProduct>
							name="manufacturer"
							label={t("common:manufacturer")}
							placeholder={t("common:manufacturer")}
						/>
						<Form.ErrorMessage<TNewProduct> name="manufacturer" />
					</Flex.Item>
					<Flex.Item>
						<Form.Input<TNewProduct>
							name="supplier"
							label={t("common:supplier")}
							placeholder={t("common:supplier")}
						/>
						<Form.ErrorMessage<TNewProduct> name="supplier" />
					</Flex.Item>
				</Flex>
				<ImageSection />
				<div className="my-4">
					<Form.Submit>Save product</Form.Submit>
				</div>
			</Form>
		</div>
	);
}
function ImageSection() {
	const methods = useFormContext<TNewProduct>();

	const image = methods.watch("image");
	const images = methods.watch("images");

	const existsImage = images?.[0];

	return (
		<div className="my-4 flex flex-col gap-4">
			<FileUpload
				value={existsImage ?? image}
				onChange={(change) => {
					console.log("change", change);
					if (existsImage) {
						methods.setValue("images", []);
					}

					methods.setValue("image", change.value);
				}}
			/>
		</div>
	);
}

function NameDetails() {
	const { t } = useTranslation(["common"]);

	return (
		<Flex wrap gap={"4"} align={"start"}>
			<Flex.Item>
				<Form.Input<TNewProduct>
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
