import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Form } from "src/components/Form";
import { useProfile } from "src/domains/profile";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { getCartCost, OrderSchema, TOrder, TProfile, TOrganization } from "@jsdev_ninja/core";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { navigate } from "src/navigation";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useEffect, useState } from "react";
import { MinimumOrderAlert } from "src/widgets/MinimumOrderAlert/MinimumOrderAlert";
import { Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFormContext } from "react-hook-form";

function AdminCreateOrderPage() {
	const { t } = useTranslation(["common", "checkout"]);

	const user = useAppSelector((state) => state.user.user);

	const profile = useProfile();

	const appApi = useAppApi();

	const cartData = useAppSelector((state) => state.cart);
	const cart = cartData.currentCart;
	console.log("CART", cart);

	const store = useAppSelector((state) => state.store.data);
	const discounts = useDiscounts();

	// State for organizations and billing accounts
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [selectedOrganization, setSelectedOrganization] = useState<TOrganization | null>(null);
	const [loading, setLoading] = useState(false);

	// Date constraints for delivery date
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const twoWeeksFromToday = new Date();
	twoWeeksFromToday.setDate(twoWeeksFromToday.getDate() + 14);

	const minDate = tomorrow.toISOString().split("T")[0]; // Format: YYYY-MM-DD
	const maxDate = twoWeeksFromToday.toISOString().split("T")[0]; // Format: YYYY-MM-DD

	// Load organizations on component mount
	useEffect(() => {
		loadOrganizations();
	}, []);

	const loadOrganizations = async () => {
		setLoading(true);
		try {
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations(result.data || []);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOrganizationSelect = (organizationId: string) => {
		if (organizationId === "none" || organizationId === "") {
			setSelectedOrganization(null);
		} else {
			const org = organizations.find((o) => o.id === organizationId);
			setSelectedOrganization(org || null);
		}
	};

	useEffect(() => {
		if (cartData.isReady && !cart) {
			navigate({ to: "admin.orders" });
		}
	}, [cartData, cart]);

	if (!store || !user || (!cartData.isReady && !cart)) {
		// todo
		return;
	}

	const emptyAddress: TProfile["address"] = {
		country: "israel",
		city: profile?.address?.city ?? "",
		street: profile?.address?.street ?? "",
		streetNumber: profile?.address?.streetNumber ?? "",
		apartmentEnterNumber: profile?.address?.apartmentEnterNumber ?? "",
		apartmentNumber: profile?.address?.apartmentNumber ?? "",
		floor: profile?.address?.floor ?? "",
	};

	const _profile: TProfile = {
		type: "Profile",
		id: profile?.id ?? user.uid,
		address: emptyAddress,
		clientType: profile?.clientType ?? "user",
		companyId: profile?.companyId ?? store.companyId,
		storeId: profile?.storeId ?? store.id,
		tenantId: profile?.tenantId ?? store.tenantId,
		email: profile?.email ?? user.email ?? "",
		displayName: profile?.displayName ?? user.displayName ?? user.email ?? "",
		createdDate: Date.now(),
		isAnonymous: profile?.isAnonymous ?? true,
		lastActivityDate: Date.now(),
		paymentType: profile?.paymentType ?? store.paymentType,
	};

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts: discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});
	console.log("store", store);
	console.log("cartCost", cartCost);

	if (cartData.isReady && !cart) {
		return null;
	}

	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 px-4">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{t("admin:createOrder.title", "Create Order")}
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					{t("admin:createOrder.description", "Create a new order for a client")}
				</p>
			</div>

			<Form<TOrder>
				className="mx-auto max-w-screen-xl px-4 2xl:px-0"
				schema={OrderSchema}
				defaultValues={{
					type: "Order",
					id: FirebaseApi.firestore.generateDocId("orders"),
					createdBy: "admin",
					userId: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					status: "draft",
					paymentStatus: store.paymentType === "external" ? "external" : "pending",
					client: _profile,
					cart: {
						id: cart?.id,
						items: cartCost.items,
						cartDiscount: cartCost.discount,
						cartTotal: cartCost.finalCost,
						cartVat: cartCost.vat,
						deliveryPrice: store.deliveryPrice ?? 0,
					},
					date: Date.now(), //todo: set on submit event
				}}
				onError={(errors) => {
					console.warn("errors", errors);
				}}
				onSubmit={async (values) => {
					if (!user || !cart) return;

					// For admin created orders, set status to pending by default
					values.status = "pending";

					if (store.paymentType === "external") {
						const order = await appApi.orders.order({
							order: {
								...values,
								storeOptions: {
									deliveryPrice: store.deliveryPrice,
									freeDeliveryPrice: store.freeDeliveryPrice,
									isVatIncludedInPrice: store.isVatIncludedInPrice,
								},
							},
						});
						console.log("new external order", order);

						navigate({ to: "admin.orders" });
						return;
					}

					const order = await appApi.orders.order({
						order: {
							...values,
							storeOptions: {
								deliveryPrice: store.deliveryPrice,
								freeDeliveryPrice: store.freeDeliveryPrice,
								isVatIncludedInPrice: store.isVatIncludedInPrice,
							},
						},
					});
					if (!order?.success) return null; //todo

					// For admin created orders, redirect to admin orders page
					navigate({ to: "admin.orders" });
				}}
			>
				<FormContent
					organizations={organizations}
					selectedOrganization={selectedOrganization}
					loading={loading}
					onOrganizationSelect={handleOrganizationSelect}
					setSelectedOrganization={setSelectedOrganization}
					minDate={minDate}
					maxDate={maxDate}
				/>
			</Form>
		</section>
	);
}

function FormContent({
	organizations,
	selectedOrganization,
	loading,
	onOrganizationSelect,
	setSelectedOrganization,
	minDate,
	maxDate,
}: {
	organizations: TOrganization[];
	selectedOrganization: TOrganization | null;
	loading: boolean;
	onOrganizationSelect: (organizationId: string) => void;
	setSelectedOrganization: (org: TOrganization | null) => void;
	minDate: string;
	maxDate: string;
}) {
	const { t } = useTranslation(["common", "checkout"]);
	const { watch, setValue } = useFormContext<TOrder>();

	const organizationId = watch("organizationId");
	const billingAccount = watch("billingAccount");
	const billingAccountId = billingAccount?.id;

	// Update selected organization when form value changes
	useEffect(() => {
		if (organizationId && organizationId !== "none") {
			const org = organizations.find((o) => o.id === organizationId);
			setSelectedOrganization(org || null);
		} else {
			setSelectedOrganization(null);
		}
	}, [organizationId, organizations, setSelectedOrganization]);

	// Clear billing account when organization changes
	useEffect(() => {
		if (!selectedOrganization) {
			setValue("billingAccount", undefined);
		}
		//  set nameOnInvoice to organization name
		if (selectedOrganization) {
			setValue("nameOnInvoice", selectedOrganization.name);
		}
	}, [selectedOrganization, setValue]);

	return (
		<div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
			<div className="min-w-0 flex-1 space-y-8">
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						{t("checkout:title")}
					</h2>

					{/* Organization and Billing Account Selection */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<label className="block text-sm font-medium text-gray-900 dark:text-white">
								{t("admin:createOrder.selectOrganization", "Select Organization")}
							</label>
							<Select
								placeholder={t(
									"admin:createOrder.selectOrganizationPlaceholder",
									"Choose an organization"
								)}
								selectedKeys={organizationId ? [organizationId] : []}
								onChange={(e) => {
									const value = e.target.value;
									setValue("organizationId", value);
									onOrganizationSelect(value);
								}}
								isDisabled={loading}
								startContent={
									<Icon icon="lucide:building-2" className="text-default-400" />
								}
								items={[
									{
										id: "none",
										name: t("admin:createOrder.noOrganization", "No Organization"),
									},
									...organizations,
								]}
							>
								{(org) => (
									<SelectItem textValue={org.name} key={org.id}>
										{org.name}
										{"discountPercentage" in org &&
											org.discountPercentage &&
											` (${org.discountPercentage}% ${t(
												"admin:createOrder.discount",
												"discount"
											)})`}
									</SelectItem>
								)}
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<label className="block text-sm font-medium text-gray-900 dark:text-white">
								{t("admin:createOrder.selectBillingAccount", "Select Billing Account")}
							</label>
							<Select
								placeholder={t(
									"admin:createOrder.selectBillingAccountPlaceholder",
									"Choose a billing account"
								)}
								selectedKeys={billingAccountId ? [billingAccountId] : []}
								onChange={(e) => {
									const account = selectedOrganization?.billingAccounts.find(
										(a) => a.id === e.target.value
									);
									if (account) {
										setValue("billingAccount", account);
									}
								}}
								isDisabled={!selectedOrganization || loading}
								startContent={
									<Icon icon="lucide:credit-card" className="text-default-400" />
								}
								items={selectedOrganization?.billingAccounts || []}
							>
								{(account) => (
									<SelectItem textValue={account.name} key={account.id}>
										{account.name} ({account.number})
									</SelectItem>
								)}
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Form.Input<TOrder>
							placeholder={t("fullName")}
							name="client.displayName"
							label={t("fullName")}
						/>
						<Form.Input<TOrder>
							placeholder={t("common:email")}
							name="client.email"
							label={t("common:email")}
						/>
						<Form.Input<TOrder>
							placeholder={t("common:city")}
							name="client.address.city"
							label={t("common:city")}
						/>
						<Form.Input<TOrder>
							placeholder={t("common:phone")}
							name="client.phoneNumber"
							label={t("common:phone")}
						/>
						<Form.Input<TOrder>
							name="client.address.street"
							placeholder={t("common:street")}
							label={t("common:street")}
						/>
						<div className="flex gap-2">
							<Form.Input<TOrder>
								name="client.address.streetNumber"
								placeholder={t("common:streetNumber")}
								label={t("common:streetNumber")}
							/>
							<div className="w-32">
								<Form.Input<TOrder>
									name="client.address.apartmentEnterNumber"
									placeholder={t("common:apartmentEnterNumber")}
									label={t("common:apartmentEnterNumber")}
								/>
							</div>
						</div>
						<Form.Input<TOrder>
							name="client.address.floor"
							placeholder={t("common:floor")}
							label={t("common:floor")}
						/>
						<Form.Input<TOrder>
							name="client.address.apartmentNumber"
							placeholder={t("common:apartmentNumber")}
							label={t("common:apartmentNumber")}
						/>
						<Form.Input<TOrder>
							name="deliveryDate"
							type="date"
							label={t("common:deliveryDate")}
							min={minDate}
							max={maxDate}
							defaultValue={minDate}
						/>
						<Form.Input<TOrder> name="nameOnInvoice" label={t("common:nameOnInvoice")} />
						<Form.TextArea<TOrder> name="clientComment" label={t("common:clientComment")} />
					</div>
					<div className="">
						<MinimumOrderAlert />
					</div>
				</div>
			</div>
			<PaymentSummary>
				<div className="space-y-3">
					<Button fullWidth type="submit">
						{t("admin:createOrder.createOrder", "Create Order")}
					</Button>
					<Button fullWidth variant="ghost" onPress={() => navigate({ to: "admin.orders" })}>
						{t("common:cancel", "Cancel")}
					</Button>
				</div>
			</PaymentSummary>
		</div>
	);
}

export default AdminCreateOrderPage;
