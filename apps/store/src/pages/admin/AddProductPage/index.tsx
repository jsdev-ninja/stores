import { NewProductSchema, TNewProduct } from "@jsdev_ninja/core";
import { Fragment, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Flex } from "src/components/Flex";
import { Form } from "src/components/Form";
// import { NewProductSchema, TNewProduct } from "src/domains";
import { TCategory } from "src/domains/Category";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";

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
				<Form.Checkbox<TNewProduct> name="vat" label={t("common:vat")} />
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="price"
					label={t("common:price")}
					placeholder={t("common:price")}
					type="number"
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="purchasePrice"
					label={t("common:purchasePrice")}
					placeholder={t("common:purchasePrice")}
					type="number"
				/>
			</Flex.Item>
			<Flex.Item>
				<Form.Input<TNewProduct>
					name="profitPercentage"
					label={t("common:profitPercentage")}
					placeholder={t("common:profitPercentage")}
					type="number"
				/>
			</Flex.Item>
		</Flex>
	);
}

export function AddProductPage() {
	const [categories, setCategories] = useState<Array<TCategory>>([]);
	console.log('categories',categories);
	

	const store = useStore();

	const appApi = useAppApi();

	const { t } = useTranslation(["admin", "common"]);

	function renderParent(category: TCategory, prefix?: string): string {
		if (!category) return "";

		if (!prefix) return `${category.locales[0].value}`;

		return `${prefix}${category.locales[0].value}`;
	}

	function renderCategory(categories: TCategory[], prefix?: string) {
		return categories.map((category) => {
			const sign = prefix ? `${prefix} > ` : "";

			return (
				<Fragment key={category.id}>
					<Form.CategorySelect.Item key={category.id} value={category}>
						{renderParent(category, sign)}
					</Form.CategorySelect.Item>
					{!!category.children?.length &&
						renderCategory(category.children, sign + category.locales[0].value)}
				</Fragment>
			);
		});
	}

	useEffect(() => {
		if (!store?.id) return;

		appApi.system.categories.get().then((categories) => {
			setCategories(categories);
		});
	}, [store?.id]);

	const title = t("admin:addProductPage.title");

	if (!store?.id || !store.companyId) return null;

	return (
		<div className="">
			<div className="text-2xl font-semibold mx-auto text-center">{title}</div>
			<Form<TNewProduct>
				className="flex flex-wrap shadow flex-col gap-4 mx-auto mt-10  p-4 justify-center max-w-screen-md"
				schema={NewProductSchema}
				defaultValues={{
					type: "Product",
					storeId: store.id,
					companyId: store.companyId,
					name: [{ lang: "he", value: "" }],
					vat: true,
					ingredients: [],
					priceType: {
						type: "unit",
						value: 1,
					},
					weight: {
						unit: "none",
						value: 0,
					},
					volume: { unit: "none", value: 0 },
					discount: { type: "none", value: 0 },
					description: [{ lang: "he", value: "" }],
					manufacturer: "",
					importer: "",
					brand: "",
					currency: "ILS",
					categoryList: [],
					categoryNames: [],
					objectID: "",
					profitPercentage: 0,
					purchasePrice: 0,
					price: 0,
					created_at: Date.now(),
					updated_at: Date.now(),
					isPublished: true,
				}}
				onError={(errors) => {
					console.error(errors);
				}}
				onSubmit={async (data) => {
					const response = await appApi.admin.productCreate(data);
					console.log("response", response);

					if (response?.success) {
						navigate({
							to: "admin.products",
						});
					}
				}}
			>
				<NameDetails />

				<Flex>
					<Form.TextArea<TNewProduct>
						name={`description[0].value`}
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
							displayValue={(categories: any) =>
								categories.map((c: any) => c.locales[0].value).join(", ")
							}
							name="categoryList"
							placeholder={t("common:selectCategory")}
							categories={categories ?? []}
							label={t("common:category")}
						>
							{renderCategory(categories)}
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
				<div className="my-4 flex flex-col gap-4">
					<Form.File<TNewProduct> name="image" label="Product image" />
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

	const url = images ? URL.createObjectURL(images) : null;

	return <div className="h-40 w-40">{url && <img src={url} className="" alt="" />}</div>;
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
