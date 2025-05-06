import { Icon } from "@iconify/react";

import { z } from "zod";

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
	Switch,
	Button,
	CardHeader,
	DateInput,
	Autocomplete,
	AutocompleteItem,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate } from "@internationalized/date";
import type { Control } from "react-hook-form";
import { useState } from "react";

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

interface BundleConfigFormProps {
	control: Control<DiscountFormData>;
	errors: any;
}

export const BundleConfigForm: React.FC<BundleConfigFormProps> = ({ control, errors }) => {
	return (
		<div className="space-y-4">
			<Controller
				name="conditions.bundle.quantity"
				control={control}
				render={({ field }) => (
					<Input
						{...field}
						value={field.value as any}
						type="number"
						label="Bundle Quantity"
						placeholder="3"
						description="Number of items in the bundle"
						isInvalid={!!errors?.conditions?.bundle?.quantity}
						errorMessage={errors?.conditions?.bundle?.quantity?.message}
						isRequired
					/>
				)}
			/>
			<Controller
				name="conditions.bundle.price"
				control={control}
				render={({ field }) => (
					<Input
						{...field}
						value={field.value as any}
						type="number"
						label="Bundle Price"
						placeholder="10.00"
						startContent="$"
						description="Total price for the bundle"
						isInvalid={!!errors?.conditions?.bundle?.price}
						errorMessage={errors?.conditions?.bundle?.price?.message}
						isRequired
					/>
				)}
			/>
			<Controller
				name="conditions.bundle.itemPrice"
				control={control}
				render={({ field }) => (
					<Input
						{...field}
						value={field.value as any}
						type="number"
						label="Regular Item Price"
						placeholder="4.00"
						startContent="$"
						description="Original price per item (for reference)"
						isInvalid={!!errors?.conditions?.bundle?.itemPrice}
						errorMessage={errors?.conditions?.bundle?.itemPrice?.message}
					/>
				)}
			/>
		</div>
	);
};

interface DiscountFormProps {
	onSubmit: (discount: Partial<Discount>) => void;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({ onSubmit }) => {
	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<DiscountFormData>({
		resolver: zodResolver(discountSchema),
		defaultValues: {
			isAutomatic: false,
			isStackable: false,
			startDate: new Date(),
			endDate: new Date(),
			conditions: {},
		},
	});

	const discountType = watch("type");
	const isAutomatic = watch("isAutomatic");

	const onFormSubmit = (data: DiscountFormData) => {
		onSubmit(data as any);
	};

	const isBundleType = discountType?.includes("bundle");
	console.log("isBundleType", isBundleType);

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardBody>
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
					<div className="space-y-4">
						<Controller
							name="name"
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
							name="type"
							control={control}
							render={({ field }) => (
								<Select
									{...field}
									label="Discount Type"
									selectedKeys={field.value ? [field.value] : []}
									onChange={(e) => field.onChange(e.target.value)}
									isRequired
								>
									<SelectItem key="bundle">Product Bundle (X for $Y)</SelectItem>
									<SelectItem key="category-bundle">Category Bundle</SelectItem>
									<SelectItem key="brand-bundle">Brand Bundle</SelectItem>
									<SelectItem key="percentage">Percentage Off</SelectItem>
									<SelectItem key="fixed">Fixed Amount Off</SelectItem>
									<SelectItem key="bogo">Buy X Get Y Free</SelectItem>
									<SelectItem key="conditional">Conditional Discount</SelectItem>
									<SelectItem key="product">Product Specific</SelectItem>
									<SelectItem key="customer">Customer Based</SelectItem>
								</Select>
							)}
						/>

						{discountType === "bundle" && (
							<>
								<BundleConfigForm control={control} errors={errors} />
								<Controller
									name="conditions.productIds"
									control={control}
									render={({ field }) => (
										<Autocomplete
											label="Select Products for Bundle"
											placeholder="Search products..."
											defaultItems={products}
											value={field.value}
											onSelectionChange={(keys) =>
												field.onChange(Array.from(keys as any))
											}
											isRequired
										>
											{(product) => (
												<AutocompleteItem key={product.id}>
													{product.name} - ${product.price}
												</AutocompleteItem>
											)}
										</Autocomplete>
									)}
								/>
							</>
						)}

						{discountType === "category-bundle" && (
							<>
								<BundleConfigForm control={control} errors={errors} />
								<Controller
									name="conditions.categoryIds"
									control={control}
									render={({ field }) => (
										<Autocomplete
											label="Select Categories"
											placeholder="Search categories..."
											defaultItems={categories}
											value={field.value}
											onSelectionChange={(keys) =>
												field.onChange(Array.from(keys as any))
											}
											isRequired
										>
											{(category) => (
												<AutocompleteItem key={category.id}>
													{category.name}
												</AutocompleteItem>
											)}
										</Autocomplete>
									)}
								/>
							</>
						)}

						{discountType === "brand-bundle" && (
							<>
								<BundleConfigForm control={control} errors={errors} />
								<Controller
									name="conditions.brandIds"
									control={control}
									render={({ field }) => (
										<Autocomplete
											label="Select Brands"
											placeholder="Search brands..."
											defaultItems={brands}
											value={field.value}
											onSelectionChange={(keys) =>
												field.onChange(Array.from(keys as any))
											}
											isRequired
										>
											{(brand) => (
												<AutocompleteItem key={brand.id}>{brand.name}</AutocompleteItem>
											)}
										</Autocomplete>
									)}
								/>
							</>
						)}

						{discountType === "product" && (
							<Controller
								name="conditions.productIds"
								control={control}
								render={({ field }) => (
									<Autocomplete
										label="Select Products"
										placeholder="Search products..."
										defaultItems={products}
										value={field.value}
										onSelectionChange={(keys) => field.onChange(Array.from(keys as any))}
										isRequired
									>
										{(product) => (
											<AutocompleteItem key={product.id}>
												{product.name} - ${product.price}
											</AutocompleteItem>
										)}
									</Autocomplete>
								)}
							/>
						)}

						{discountType === "customer" && (
							<Controller
								name="conditions.customerType"
								control={control}
								render={({ field }) => (
									<Autocomplete
										label="Select Customer Type"
										placeholder="Search customer types..."
										defaultItems={customerTypes}
										value={field.value ? [field.value] : []}
										onSelectionChange={(keys) =>
											field.onChange(Array.from(keys as any)[0])
										}
										isRequired
									>
										{(type) => (
											<AutocompleteItem key={type.id}>{type.name}</AutocompleteItem>
										)}
									</Autocomplete>
								)}
							/>
						)}

						<div className="flex gap-4">
							<Controller
								name="isAutomatic"
								control={control}
								render={({ field }) => (
									<Switch isSelected={field.value} onValueChange={field.onChange}>
										Automatic Discount
									</Switch>
								)}
							/>
							<Controller
								name="isStackable"
								control={control}
								render={({ field }) => (
									<Switch isSelected={field.value} onValueChange={field.onChange}>
										Stackable with Other Discounts
									</Switch>
								)}
							/>
						</div>

						{!isAutomatic && (
							<Controller
								name="code"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										label="Discount Code"
										placeholder="BUNDLE3X10"
										isInvalid={!!errors.code}
										errorMessage={errors.code?.message}
										isRequired
									/>
								)}
							/>
						)}

						<Controller
							name="usageLimit"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value as unknown as string}
									type="number"
									label="Usage Limit"
									placeholder="100"
									isInvalid={!!errors.usageLimit}
									errorMessage={errors.usageLimit?.message}
									isRequired
								/>
							)}
						/>

						<div className="flex gap-4">
							<Controller
								name="startDate"
								control={control}
								render={({ field }) => (
									<DateInput
										label="Start Date"
										value={
											new CalendarDate(
												field.value.getFullYear(),
												field.value.getMonth() + 1,
												field.value.getDate()
											)
										}
										onChange={(date) => field.onChange(new Date(date?.toString() ?? 0))}
									/>
								)}
							/>
							<Controller
								name="endDate"
								control={control}
								render={({ field }) => (
									<DateInput
										label="End Date"
										value={
											new CalendarDate(
												field.value.getFullYear(),
												field.value.getMonth() + 1,
												field.value.getDate()
											)
										}
										onChange={(date) => field.onChange(new Date(date?.toString() ?? 0))}
									/>
								)}
							/>
						</div>
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
	discounts: Discount[];
	onDelete: (id: string) => void;
}

export const DiscountList: React.FC<DiscountListProps> = ({ discounts, onDelete }) => {
	return (
		<Table aria-label="Active Discounts">
			<TableHeader>
				<TableColumn>NAME</TableColumn>
				<TableColumn>TYPE</TableColumn>
				<TableColumn>VALUE</TableColumn>
				<TableColumn>CODE</TableColumn>
				<TableColumn>USAGE</TableColumn>
				<TableColumn>STATUS</TableColumn>
				<TableColumn>ACTIONS</TableColumn>
			</TableHeader>
			<TableBody>
				{discounts.map((discount) => (
					<TableRow key={discount.id}>
						<TableCell>{discount.name}</TableCell>
						<TableCell>
							<Chip size="sm" variant="flat">
								{discount.type}
							</Chip>
						</TableCell>
						<TableCell>
							{discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
						</TableCell>
						<TableCell>
							{discount.code || (
								<Chip size="sm" color="success">
									Automatic
								</Chip>
							)}
						</TableCell>
						<TableCell>
							{discount.usageCount} / {discount.usageLimit}
						</TableCell>
						<TableCell>
							<Chip size="sm" color={new Date() > discount.endDate ? "danger" : "success"}>
								{new Date() > discount.endDate ? "Expired" : "Active"}
							</Chip>
						</TableCell>
						<TableCell>
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

const bundleConfigSchema = z.object({
	quantity: z.number().min(1, "Quantity must be at least 1"),
	price: z.number().min(0, "Price must be positive"),
	itemPrice: z.number().min(0, "Item price must be positive").optional(),
});

export const discountSchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	type: z.enum([
		"percentage",
		"fixed",
		"bogo",
		"conditional",
		"product",
		"customer",
		"bundle",
		"category-bundle",
		"brand-bundle",
	]),
	value: z.number().min(0, "Value must be positive"),
	code: z.string().optional(),
	isAutomatic: z.boolean(),
	isStackable: z.boolean(),
	startDate: z.date(),
	endDate: z.date(),
	usageLimit: z.number().min(1, "Usage limit must be at least 1"),
	conditions: z
		.object({
			minSpend: z.number().optional(),
			productIds: z.array(z.string()).optional(),
			categoryIds: z.array(z.string()).optional(),
			brandIds: z.array(z.string()).optional(),
			customerType: z.enum(["new", "returning", "vip", "all"]).optional(),
			bundle: bundleConfigSchema.optional(),
		})
		.optional(),
});

export type DiscountFormData = z.infer<typeof discountSchema>;

export type DiscountType =
	| "percentage"
	| "fixed"
	| "bogo"
	| "conditional"
	| "product"
	| "customer"
	| "bundle"
	| "category-bundle"
	| "brand-bundle";

export interface BundleConfig {
	quantity: number;
	price: number;
	itemPrice?: number; // Original price per item
}

export interface Discount {
	id: string;
	name: string;
	type: DiscountType;
	value: number;
	code?: string;
	isAutomatic: boolean;
	isStackable: boolean;
	startDate: Date;
	endDate: Date;
	usageLimit: number;
	usageCount: number;
	conditions?: {
		minSpend?: number;
		productIds?: string[];
		categoryIds?: string[];
		brandIds?: string[];
		customerType?: "new" | "vip" | "all";
		bundle?: BundleConfig;
	};
}

function AdminDiscountsPage() {
	const [showForm, setShowForm] = useState(false);
	const [discounts, setDiscounts] = useState<Discount[]>([]);

	const handleCreateDiscount = (newDiscount: Partial<Discount>) => {
		const discount: Discount = {
			...newDiscount,
			id: Math.random().toString(36).substr(2, 9),
			usageCount: 0,
		} as Discount;

		setDiscounts([...discounts, discount]);
		setShowForm(false);
	};

	const handleDeleteDiscount = (id: string) => {
		setDiscounts(discounts.filter((d) => d.id !== id));
	};

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
