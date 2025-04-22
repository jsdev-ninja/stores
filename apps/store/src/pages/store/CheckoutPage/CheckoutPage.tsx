import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Form } from "src/components/Form";
import { useProfile } from "src/domains/profile";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { OrderSchema, TOrder, TProfile } from "@jsdev_ninja/core";
import { calculateCartPrice } from "src/utils/calculateCartPrice";
import { PaymentSummary } from "src/widgets/PaymentSummary";
import { navigate } from "src/navigation";

function CheckoutPage() {
	const { t } = useTranslation(["common", "checkout"]);

	const user = useAppSelector((state) => state.user.user);

	const profile = useProfile();

	const appApi = useAppApi();

	const cart = useAppSelector((state) => state.cart.currentCart);
	const store = useAppSelector((state) => state.store.data);

	if (!store || !user || !cart) {
		return null;
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
	};

	const cartCost = calculateCartPrice(cart.items);
	console.log("store", store);

	return (
		<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 px-4">
			<Form<TOrder>
				className="mx-auto max-w-screen-xl px-4 2xl:px-0"
				schema={OrderSchema}
				defaultValues={{
					type: "Order",
					id: FirebaseApi.firestore.generateDocId("orders"),
					userId: user.uid,
					companyId: store.companyId,
					storeId: store.id,
					status: "draft",
					paymentStatus: "pending",
					client: _profile,
					cart: {
						id: cart.id,
						items: cart.items,
						cartDiscount: cartCost.discount,
						cartTotal: cartCost.finalCost,
						cartVat: cartCost.vat,
					},
					date: Date.now(), //todo: set on submit event
				}}
				onError={(errors) => {
					console.warn("errors", errors);
				}}
				onSubmit={async (values) => {
					if (!user || !cart) return;

					if (store.paymentType === "external") {
						values.status = "pending";
						const order = await appApi.orders.order({ order: values });
						console.log("new external order", order);

						navigate({ to: "store.orders" });

						return;
					}

					const order = await appApi.orders.order({ order: values });
					if (!order?.success) return null; //todo

					const payment = await appApi.user.createPaymentLink({ order: values });
					window.location.href = payment.data.paymentLink;
				}}
			>
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
							</div>
						</div>
					</div>
					<PaymentSummary>
						<div className="space-y-3">
							<Button fullWidth type="submit">
								{t("checkout:order")}
							</Button>
						</div>
					</PaymentSummary>
				</div>
			</Form>
		</section>
	);
}

export default CheckoutPage;
