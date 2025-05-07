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
				productsId: ["", ""],
			},
		},
	});

	const appApi = useAppApi();

	const onFormSubmit = async (data: TDiscount) => {
		console.log("data", data);
		const res = await appApi.admin.createDiscount(data);
		console.log("appApi", res);
		onSubmit(data);

		// onSubmit(data as any);
	};

	const [products, setProducts] = useState<string[]>(["1aa", "2bb"]);

	console.log("form", watch());

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
										label="Discount Type"
										selectedKeys={field.value ? new Set([field.value]) : []}
										onChange={(e) => field.onChange(e.target.value)}
										isRequired
										isDisabled
									>
										<SelectItem key="bundle">bundle</SelectItem>
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
									label="Discount Name"
									placeholder="3 for $10 Bundle"
									isInvalid={!!errors.name}
									errorMessage={errors.name?.message}
									isRequired
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
									label="Bundle Quantity"
									placeholder="3"
									description="Number of items in the bundle"
									isInvalid={!!errors?.variant?.requiredQuantity}
									errorMessage={errors?.variant?.requiredQuantity?.message}
									isRequired
								/>
							)}
						/>
						<Controller
							name="variant.discountPrice"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									onChange={(e) => field.onChange(+e.target.value)}
									value={field.value as any}
									type="number"
									label="Bundle Price"
									placeholder="10.00"
									startContent="$"
									description="Total price for the bundle"
									isInvalid={!!errors?.variant?.discountPrice}
									errorMessage={errors?.variant?.discountPrice?.message}
									isRequired
								/>
							)}
						/>
						{products.map((p, index) => (
							<div key={p} className="flex items-center gap-2">
								<Controller
									name={`variant.productsId.${index}`}
									control={control}
									render={({ field }) => {
										console.log("field", field.name, field);
										return <ProductInput field={field} />;
									}}
								/>
								<Button
									onPress={() => {
										setValue(
											"variant.productsId",
											getValues("variant.productsId").filter((_, i) => i !== index)
										);
										setProducts(products.filter((_p) => _p !== p));
									}}
									isIconOnly
								>
									<Icon icon="lucide:x" />
								</Button>
							</div>
						))}
						<Button fullWidth onPress={() => setProducts([...products, crypto.randomUUID()])}>
							add new item
						</Button>
					</div>

					<Button
						type="submit"
						color="primary"
						startContent={<Icon icon="lucide:plus" />}
						className="w-full"
					>
						Create Discount
					</Button>
				</form>
			</CardBody>
		</Card>
	);
};

function ProductInput({ field }: any) {
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	console.log("searchResults", searchResults);

	const handleSearch = async (value: string) => {
		if (!value) {
			setSearchResults([]);
			return;
		}

		setIsLoading(true);
		try {
			const { hits } = await productsIndex.search<TProduct>(value);
			console.log("hits", hits);

			setSearchResults(hits);
		} catch (error) {
			console.error("Search error:", error);
			setSearchResults([]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Autocomplete
			onSelectionChange={(id) => {
				console.log("onchage", id);
				field.onChange(id);
			}}
			className="max-w-xl"
			items={searchResults}
			label="Search products"
			variant="bordered"
			color="primary"
			size="lg"
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
								{item.categoryNames[0]}
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
	onDelete: (id: string) => void;
}

export const DiscountList: React.FC<DiscountListProps> = ({ discounts, onDelete }) => {
	return (
		<Table aria-label="Active Discounts">
			<TableHeader>
				<TableColumn>NAME</TableColumn>
				<TableColumn>TYPE</TableColumn>
				<TableColumn>status</TableColumn>
				<TableColumn>actions</TableColumn>
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
							<Button
								isIconOnly
								color="danger"
								variant="shadow"
								onPress={() => onDelete(discount.id)}
							>
								view
							</Button>
							<Tooltip content="Delete Discount">
								<Button
									isIconOnly
									color="danger"
									variant="light"
									onPress={() => onDelete(discount.id)}
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

	const appApi = useAppApi();

	const handleCreateDiscount = () => {
		// const discount: TDiscount = {
		// 	id: FirebaseApi.firestore.generateDocId("discounts"),
		// 	...newDiscount,
		// 	usageCount: 0,
		// } as TDiscount;

		// setDiscounts([...discounts, discount]);
		setShowForm(false);
	};

	const handleDeleteDiscount = (id: string) => {
		setDiscounts(discounts.filter((d) => d.id !== id));
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
						<h1 className="text-2xl font-bold">Discount Management</h1>
						<p className="text-default-500">Manage your store's discounts and promotions</p>
					</div>
					<Button
						color="primary"
						startContent={<Icon icon={showForm ? "lucide:x" : "lucide:plus"} />}
						onPress={() => setShowForm(!showForm)}
					>
						{showForm ? "Cancel" : "New Discount"}
					</Button>
				</CardHeader>
				<Divider />
				<CardBody>
					{showForm ? (
						<DiscountForm onSubmit={handleCreateDiscount} />
					) : (
						<DiscountList discounts={discounts} onDelete={handleDeleteDiscount} />
					)}
				</CardBody>
			</Card>
		</div>
	);
}
export default AdminDiscountsPage;
