import { Icon } from "@iconify/react";

import {
	Card,
	CardBody,
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Chip,
	Tooltip,
	Divider,
	Input,
	Select,
	SelectItem,
	Button,
	CardHeader,
	Autocomplete,
	AutocompleteItem,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { DiscountSchema, TDiscount, TProduct } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { useStore } from "src/domains/Store";
import { useAppApi } from "src/appApi";

import { AlgoliaClient } from "src/services";
import { useTranslation } from "react-i18next";

const productsIndex = AlgoliaClient.initIndex("products"); // Replace with your index name

export const categories = [
	{ id: "1", name: "Electronics" },
	{ id: "2", name: "Clothing" },
	{ id: "3", name: "Books" },
	{ id: "4", name: "Home & Garden" },
	{ id: "5", name: "Sports" },
	{ id: "6", name: "Toys" },
];

export const brands = [
	{ id: "1", name: "Apple" },
	{ id: "2", name: "Nike" },
	{ id: "3", name: "Samsung" },
	{ id: "4", name: "Adidas" },
	{ id: "5", name: "Sony" },
	{ id: "6", name: "Levi's" },
];

export const customerTypes = [
	{ id: "new", name: "New Customers" },
	{ id: "returning", name: "Returning Customers" },
	{ id: "vip", name: "VIP Members" },
	{ id: "all", name: "All Customers" },
];

interface DiscountFormProps {
	onSubmit: (discount: Partial<TDiscount>) => void;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({ onSubmit }) => {
	const store = useStore();

	const { t } = useTranslation(["common", "admin"]);

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
		setValue,
		getValues,
	} = useForm<TDiscount>({
		resolver: zodResolver(DiscountSchema),
		defaultValues: {
			type: "Discount",
			companyId: store?.companyId ?? "",
			storeId: store?.id ?? "",
			id: FirebaseApi.firestore.generateDocId("discounts"),
			active: true,
			name: [{ lang: "he", value: "" }],
			variant: {
				variantType: "bundle",
				productsId: [],
				requiredQuantity: 0,
				bundlePrice: 0,
			},
			conditions: {
				stackable: false,
			},
			startDate: Date.now(),
			endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
		},
	});

	const appApi = useAppApi();

	const onFormSubmit = async (data: TDiscount) => {
		if (data.variant.variantType === "bundle") {
			//todo default image from product - removed from new schema
		}
		await appApi.admin.createDiscount(data);
		onSubmit(data);

		// onSubmit(data as any);
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardBody>
				<form onSubmit={handleSubmit(onFormSubmit, console.error)} className="space-y-6">
					<div className="space-y-4">
						<Controller
							name="variant.variantType"
							control={control}
							render={({ field }) => {
								return (
									<Select
										{...field}
										label={t("admin:discountsPage.discountType")}
										selectedKeys={field.value ? new Set([field.value]) : []}
										onChange={(e) => field.onChange(e.target.value)}
										isDisabled
									>
										<SelectItem key="bundle">{t("common:bundle")}</SelectItem>
									</Select>
								);
							}}
						/>
						<Controller
							name={`name.0.value`}
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									label={t("common:discountName")}
									placeholder="למשל 3 מוצרי חלב ב10"
									isInvalid={!!errors.name}
									errorMessage={errors.name?.message}
								/>
							)}
						/>

						<Controller
							name="variant.requiredQuantity"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									onChange={(e) => field.onChange(+e.target.value)}
									value={field.value as any}
									type="number"
									label={t("admin:discountsPage.prodcutQuantity")}
									placeholder="הזן מספר"
									description="Number of items in the bundle"
									isInvalid={!!errors?.variant?.requiredQuantity}
									errorMessage={errors?.variant?.requiredQuantity?.message}
									isRequired
								/>
							)}
						/>
						<Controller
							name="variant.bundlePrice"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									onChange={(e) => field.onChange(+e.target.value)}
									value={field.value as any}
									type="number"
									label={t("admin:discountsPage.discountFinalPrice")}
									placeholder="10.00"
									startContent="$"
									description="Total price for the bundle"
									isInvalid={!!errors?.variant?.bundlePrice}
									errorMessage={errors?.variant?.bundlePrice?.message}
									isRequired
								/>
							)}
						/>
						{watch("variant.productsId")?.map((productId, index) => (
							<div key={productId} className="flex items-center gap-2">
								<Controller
									name={`variant.productsId.${index}`}
									control={control}
									render={({ field }) => {
										return <ProductInput field={field} />;
									}}
								/>
								<Button
									onPress={() => {
										const currentProducts = getValues("variant.productsId");
										setValue(
											"variant.productsId",
											currentProducts.filter((_, i) => i !== index)
										);
									}}
									size="lg"
									color="danger"
									isIconOnly
								>
									<Icon icon="lucide:x" />
								</Button>
							</div>
						))}
						<Button
							fullWidth
							onPress={() => {
								const currentProducts = getValues("variant.productsId") || [];
								setValue("variant.productsId", [...currentProducts, ""]);
							}}
						>
							{t("addProduct")}
						</Button>
					</div>

					<Button
						type="submit"
						color="primary"
						startContent={<Icon icon="lucide:plus" />}
						className="w-full"
					>
						{t("admin:discountsPage.createDiscount")}
					</Button>
				</form>
			</CardBody>
		</Card>
	);
};

function ProductInput({ field }: any) {
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);

	const { t } = useTranslation(["common", "admin"]);

	const store = useStore();

	// Sync selected product when search results change
	useEffect(() => {
		if (field.value && searchResults.length > 0) {
			const found = searchResults.find((p) => p.id === field.value || p.objectID === field.value);
			if (found) {
				setSelectedProduct((prev) => {
					// Only update if different
					if (!prev || prev.id !== found.id) {
						return found;
					}
					return prev;
				});
			}
		}
	}, [searchResults, field.value]);

	// Load selected product when field value changes
	useEffect(() => {
		if (!field.value) {
			setSelectedProduct(null);
			return;
		}

		// Check if we already have the product selected
		setSelectedProduct((prev) => {
			if (prev && (prev.id === field.value || prev.objectID === field.value)) {
				return prev;
			}
			return null;
		});

		// Check if product is in search results
		const foundInResults = searchResults.find((p) => p.id === field.value || p.objectID === field.value);
		if (foundInResults) {
			return;
		}

		// Load product if not found
		if (store) {
			setIsLoading(true);
			productsIndex
				.search<TProduct>("", {
					filters: `storeId:${store.id} AND companyId:${store.companyId} AND (objectID:"${field.value}" OR id:"${field.value}")`,
				})
				.then(({ hits }) => {
					if (hits.length > 0) {
						setSelectedProduct(hits[0]);
						setSearchResults((prev) => {
							// Add to results if not already there
							if (!prev.find((p) => p.id === hits[0].id || p.objectID === hits[0].objectID)) {
								return [...prev, hits[0]];
							}
							return prev;
						});
					}
				})
				.catch((error) => {
					console.error("Error loading product:", error);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [field.value, store]);

	const handleSearch = async (value: string) => {
		if (!store) return;
		if (!value) {
			// Keep selected product in results if it exists
			if (selectedProduct) {
				setSearchResults([selectedProduct]);
			} else {
				setSearchResults([]);
			}
			return;
		}

		setIsLoading(true);
		try {
			// todo
			const { hits } = await productsIndex.search<TProduct>(value, {
				filters: `storeId:${store.id} AND companyId:${store.companyId}`,
			});

			setSearchResults(hits);
		} catch (error) {
			console.error("Search error:", error);
			setSearchResults([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectionChange = (id: string | number | null) => {
		if (!id) {
			field.onChange("");
			setSelectedProduct(null);
			return;
		}
		const product = searchResults.find((p) => p.id === id || p.objectID === id);
		if (product) {
			setSelectedProduct(product);
			// Store the objectID as the value since that's what we use as the key
			field.onChange(product.objectID || product.id);
		} else {
			field.onChange(id);
		}
	};

	// Combine search results with selected product if not already included
	const displayItems = searchResults.length > 0 
		? searchResults 
		: selectedProduct 
			? [selectedProduct] 
			: [];

	// Get the selected key - use objectID if available, otherwise use the field value
	const selectedKey = selectedProduct?.objectID || field.value || null;

	return (
		<Autocomplete
			selectedKey={selectedKey}
			onSelectionChange={handleSelectionChange}
			className="max-w-xl"
			items={displayItems}
			label={t("common:searchProduct")}
			variant="bordered"
			color="primary"
			size="sm"
			onInputChange={handleSearch}
			isLoading={isLoading}
			startContent={<Icon icon="lucide:search" className="text-default-400" />}
			inputProps={{
				classNames: {
					input: "text-base",
				},
			}}
		>
			{(item) => (
				<AutocompleteItem
					key={item.objectID}
					textValue={item.name[0].value}
					className="flex items-center gap-4 p-2"
				>
					<img
						src={item.images?.[0]?.url}
						alt={item.name[0]?.value}
						className="w-12 h-12 rounded-md object-cover"
					/>
					<div className="flex flex-col gap-1">
						<span className="text-default-900">{item.name[0].value}</span>
						<div className="flex items-center gap-2">
							<span className="text-default-600">${item.price}</span>
							<Chip size="sm" variant="flat" color="primary">
								{item.categoryNames?.[0] || "No category"}
							</Chip>
						</div>
					</div>
				</AutocompleteItem>
			)}
		</Autocomplete>
	);
}

interface DiscountListProps {
	discounts: TDiscount[];
	setDiscounts: (discounts: TDiscount[]) => void;
}

export const DiscountList: React.FC<DiscountListProps> = ({ discounts, setDiscounts }) => {
	const { t } = useTranslation(["common", "admin"]);

	const appApi = useAppApi();

	return (
		<Table aria-label="Active Discounts">
			<TableHeader>
				<TableColumn>{t("admin:discountsPage.tableHeader.name")}</TableColumn>
				<TableColumn>{t("admin:discountsPage.tableHeader.type")}</TableColumn>
				<TableColumn>{t("admin:discountsPage.tableHeader.status")}</TableColumn>
				<TableColumn>{t("admin:discountsPage.tableHeader.actions")}</TableColumn>
			</TableHeader>
			<TableBody>
				{discounts.map((discount) => (
					<TableRow key={discount.id}>
						<TableCell>{discount.name[0].value}</TableCell>
						<TableCell>
							<Chip size="sm" variant="flat">
								{discount.variant.variantType}
							</Chip>
						</TableCell>
						<TableCell>
							<Chip size="sm" variant="flat">
								{discount.active ? "active" : "not active"}
							</Chip>
						</TableCell>
						<TableCell>
							<Button isIconOnly color="danger" variant="shadow" onPress={() => {}}>
								view
							</Button>
							<Tooltip content="Delete Discount">
								<Button
									className=""
									isIconOnly
									color="danger"
									variant="light"
									onPress={async () => {
										// handle delete
										const res = await appApi.admin.deleteDiscount(discount.id);
										if (res?.success) {
											setDiscounts(discounts.filter((d) => d.id !== discount.id));
										}
									}}
								>
									<Icon icon="lucide:trash-2" />
								</Button>
							</Tooltip>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

function AdminDiscountsPage() {
	const [showForm, setShowForm] = useState(false);
	const [discounts, setDiscounts] = useState<TDiscount[]>([]);

	const { t } = useTranslation(["common", "admin"]);

	const appApi = useAppApi();

	const handleCreateDiscount = () => {
		setShowForm(false);
	};

	useEffect(() => {
		const unsubscribe = appApi.admin.subscribeToDiscounts(setDiscounts);

		return () => unsubscribe?.();
	}, []);

	return (
		<div className="container mx-auto p-6 max-w-7xl">
			<Card>
				<CardHeader className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold">{t("admin:discountsPage.title")}</h1>
						<p className="text-default-500">{t("admin:discountsPage.description")}</p>
					</div>
					<Button
						color="primary"
						startContent={<Icon icon={showForm ? "lucide:x" : "lucide:plus"} />}
						onPress={() => setShowForm(!showForm)}
					>
						{showForm ? t("common:cancel") : t("admin:discountsPage.createDiscount")}
					</Button>
				</CardHeader>
				<Divider />
				<CardBody>
					{showForm ? (
						<DiscountForm onSubmit={handleCreateDiscount} />
					) : (
						<DiscountList setDiscounts={setDiscounts} discounts={discounts} />
					)}
				</CardBody>
			</Card>
		</div>
	);
}
export default AdminDiscountsPage;
