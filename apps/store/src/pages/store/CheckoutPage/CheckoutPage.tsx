import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Form } from "src/components/Form";
import { useProfile } from "src/domains/profile";
import { useAppSelector } from "src/infra";
import { AddressSchema, getCartCost, TOrder, TProfile } from "@jsdev_ninja/core";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { navigate } from "src/navigation";
import { submitHypForm } from "src/lib/payment/submitHypForm";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { MinimumOrderAlert } from "src/widgets/MinimumOrderAlert/MinimumOrderAlert";
import BalasiCheckoutLayout from "src/websites/balasistore/CheckoutLayout";
import { z } from "zod";


const checkoutSchema = z.object({
	nameOnInvoice: z.string().nonempty(),
	clientComment: z.string().optional(),
	deliveryDate: z.coerce.date(),
	address: AddressSchema,
	email: z.string().email(),
	phone: z.string().optional(),
});

type TCheckout = z.infer<typeof checkoutSchema>;

function CheckoutPage() {
	const { t } = useTranslation(["common", "checkout"]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const user = useAppSelector((state) => state.user.user);

	const profile = useProfile();


	const profileOrganization = useAppSelector((state) => state.userOrganization.activeOrganization);
	const userOrganizations = useAppSelector((state) => state.userOrganization.organizations);

	const appApi = useAppApi();

	const cartData = useAppSelector((state) => state.cart);
	const cart = cartData.currentCart;

	const store = useAppSelector((state) => state.store.data);
	const discounts = useDiscounts();

	// Date constraints for delivery date
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const twoWeeksFromToday = new Date();
	twoWeeksFromToday.setDate(twoWeeksFromToday.getDate() + 14);

	const minDate = tomorrow.toISOString().split("T")[0]; // Format: YYYY-MM-DD
	const maxDate = twoWeeksFromToday.toISOString().split("T")[0]; // Format: YYYY-MM-DD

	if (!store || !user || (!cartData.isReady && !cart)) {
		// todo
		return;
	}

	if (userOrganizations.length > 0 && !profileOrganization) {
		return (
			<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 px-4">
				<div className="mx-auto max-w-screen-xl px-4 2xl:px-0 text-center">
					<p className="text-lg text-default-600">יש לבחור ארגון לפני ביצוע הזמנה.</p>
				</div>
			</section>
		);
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
		organizationId: profile?.organizationId ?? "",
		phoneNumber: profile?.phoneNumber ?? "",
		companyName: profile?.companyName ?? "",
	};

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts: discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	if (cartData.isReady && !cart) {
		return null;
	}

	// Balasi storefront gets a dedicated checkout LAYOUT (markup only). The
	// <Form>, schema, defaultValues and onSubmit below are shared and unchanged,
	// so the order data and payment flow are identical for every store.
	const isBalasi = store.id === "balasistore_store" || store.id === "tester_store";



	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 px-4">
			<Form<TCheckout>
				className="mx-auto max-w-screen-xl px-4 2xl:px-0"
				schema={checkoutSchema}
				defaultValues={{
					nameOnInvoice: profileOrganization?.nameOnInvoice ?? "",
					address: profile?.address ?? emptyAddress,
					email: profile?.email ?? "",
					phone: profile?.phoneNumber ?? "",
					clientComment: "",
				}}
				onError={(errors) => {
					console.warn("errors", errors);
				}}
				onSubmit={async (values) => {
					if (!user || !cart) return;
					if (isSubmitting) return;
					setIsSubmitting(true);

					try {
						const newOrder: TOrder = {
							type: "Order",
							// Deterministic ID = cart.id → idempotent across rage-clicks, page refresh, multi-tab.
							// createV2 transactionally bails on duplicate, so 2nd attempt won't create another doc.
							id: cart.id,
							createdBy: "user",
							userId: user.uid,
							companyId: store.companyId,
							storeId: store.id,
							status: "draft",
							paymentStatus: store.paymentType === "external" ? "external" : "pending",
							client: _profile,
							organizationId: profileOrganization?.id,
							cart: {
								id: cart.id,
								items: cartCost.items,
								cartDiscount: cartCost.discount,
								cartTotal: cartCost.finalCost,
								cartVat: cartCost.vat,
								deliveryPrice: cartCost.deliveryPrice,
							},
							date: Date.now(), //todo: set on submit event
							storeOptions: {
								deliveryPrice: store.deliveryPrice,
								freeDeliveryPrice: store.freeDeliveryPrice,
								isVatIncludedInPrice: store.isVatIncludedInPrice,
							},
							// form data
							deliveryDate: values.deliveryDate.getTime(),
							address: values.address,
							nameOnInvoice: values.nameOnInvoice,
							clientComment: values.clientComment,
							emailOnInvoice: values.email,
							phoneNumberOnInvoice: values.phone,
						}

						if (
							store.paymentType === "external" ||
							profileOrganization?.paymentType === "external" ||
							profile?.paymentType === "external"
						) {
							newOrder.status = "pending";
							newOrder.paymentType = "external";
							// createV2 returns success:false when the doc already exists (re-submit/refresh).
							// Either way, navigate to orders — order is in DB.
							await appApi.orders.order({
								order: newOrder,
							});

							navigate({ to: "store.orders" });

							return;
						}

						newOrder.paymentType = "j5";

						// Don't bail on success:false — that fires when the order already exists
						// (rage-click / refresh). Continue to payment link generation either way.
						await appApi.orders.order({
							order: newOrder,
						});

						const payment = await appApi.user.createPaymentLink({ order: newOrder, isJ5: true });
						if (payment?.data?.formAction && payment?.data?.formFields) {
							submitHypForm(payment.data.formAction, payment.data.formFields);
							return;
						}
						if (payment?.data?.paymentLink) {
							window.location.href = payment.data.paymentLink;
							return;
						}
						navigate({ to: "store.paymentPending" });
					} finally {
						setIsSubmitting(false);
					}
				}}
			>
				{isBalasi ? (
					<BalasiCheckoutLayout
						t={t}
						minDate={minDate}
						maxDate={maxDate}
						isSubmitting={isSubmitting}
					/>
				) : (
				<div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
					<div className="min-w-0 flex-1 space-y-8">
						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
								{t("checkout:title")}
							</h2>
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
									defaultValue={tomorrow.toISOString().split("T")[0]}
								/>
								<Form.Input<TOrder>
									name="nameOnInvoice"
									label={t("common:nameOnInvoice")}
								/>
								<Form.TextArea<TOrder>
									name="clientComment"
									label={t("common:clientComment")}
								/>
							</div>
							<div className="">
								<MinimumOrderAlert />
							</div>
						</div>
					</div>
					<PaymentSummary>
						<div className="space-y-3">
							<Button fullWidth type="submit" isPending={isSubmitting} isDisabled={isSubmitting}>
								{t("checkout:order")}
							</Button>
						</div>
					</PaymentSummary>
				</div>
				)}
			</Form>
		</section>
	);
}

export default CheckoutPage;
