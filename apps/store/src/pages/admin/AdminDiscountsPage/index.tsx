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
import { DiscountSchema, TDiscount } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { useStore } from "src/domains/Store";
import { useAppApi } from "src/appApi";

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

export const products = [
	{ id: "1", name: "iPhone 15", category: "Electronics", brand: "Apple", price: 999 },
	{ id: "2", name: "MacBook Pro", category: "Electronics", brand: "Apple", price: 1299 },
	{ id: "3", name: "Nike Air Max", category: "Clothing", brand: "Nike", price: 129 },
	{ id: "4", name: "Levi's 501", category: "Clothing", brand: "Levi's", price: 69 },
	{ id: "5", name: "The Great Gatsby", category: "Books", price: 15 },
	{ id: "6", name: "Garden Tools Set", category: "Home & Garden", price: 89 },
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
			},
		},
	});

	const appApi = useAppApi();

	const discountType = watch("variant.variantType");

	const onFormSubmit = async (data: TDiscount) => {
		console.log("data", data);
		const res = await appApi.admin.createDiscount(data);
		console.log("appApi", res);
		onSubmit(data);

		// onSubmit(data as any);
	};

	const isBundleType = discountType?.includes("bundle");
	console.log("isBundleType", isBundleType);

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
						<Controller
							name="variant.productsId"
							control={control}
							render={({ field }) => (
								<Autocomplete
									label="Select Products for Bundle"
									placeholder="Search products..."
									defaultItems={products}
									value={field.value}
									onSelectionChange={(keys) => field.onChange(Array.from(keys as any))}
									isRequired
									multiple
								>
									{(product) => (
										<AutocompleteItem key={product.id}>{product.name}</AutocompleteItem>
									)}
								</Autocomplete>
							)}
						/>
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
