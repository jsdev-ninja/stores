import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Form } from "src/components/Form";
import { OrderSchema, TOrder } from "src/domains/Order";
import { useProfile } from "src/domains/profile";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";
import { TAddress, TProfile } from "src/types";
import { calculateCartPrice } from "src/utils/calculateCartPrice";
import { PaymentSummary } from "src/widgets/PaymentSummary";

function CheckoutPage() {
	const { t } = useTranslation(["common", "checkout"]);

	const user = useAppSelector((state) => state.user.user);

	const profile = useProfile();

	const appApi = useAppApi();

	const cart = useAppSelector((state) => state.cart.currentCart);
	const store = useAppSelector((state) => state.store.data);

	if (!store || !user || !cart) {
		return null; // todo
	}

	const emptyAddress: TAddress = {
		country: "israel",
		city: "",
		street: "",
		streetNumber: "",
		apartmentEnterNumber: "",
		apartmentNumber: "",
		floor: "",
	};

	const _profile: TProfile = {
		type: "Profile",
		id: profile?.id ?? user.uid,
		address: profile?.address ?? emptyAddress,
		clientType: profile?.clientType ?? "user",
		companyId: profile?.companyId ?? store.companyId,
		storeId: profile?.storeId ?? store.id,
		tenantId: profile?.tenantId ?? store.tenantId,
		email: profile?.email ?? user.email ?? "",
		fullName: profile?.fullName ?? user.displayName ?? user.email ?? "",
		phoneNumber: {
			code: profile?.phoneNumber?.code ?? "",
			number: profile?.phoneNumber?.number ?? "",
		},
	};

	const cartCost = calculateCartPrice(cart.items);

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
					status: "pending",
					client: _profile,
					address: profile?.address ?? emptyAddress,
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
					console.log("errors", errors);
				}}
				onSubmit={async () => {
					console.log("submit");

					if (!user || !cart) return;
					const order = await appApi.orders.order();
					console.log("order", order);

					if (order?.success) {
						navigate({
							to: "store.orderSuccess",
							params: { orderId: order.data.id },
						});
						// todo: clean cart
					}
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
									name="client.fullName"
									label={t("fullName")}
								/>
								<Form.Input<TOrder>
									placeholder={t("common:email")}
									name="client.email"
									label={t("common:email")}
								/>
								<Form.Input<TOrder>
									placeholder={t("common:city")}
									name="address.city"
									label={t("common:city")}
								/>
								<Form.Input<TOrder>
									placeholder={t("common:phone")}
									name="client.phoneNumber.number"
									label={t("common:phone")}
									endAdornment={<span dir="ltr">+972</span>}
								/>
								<Form.Input<TOrder>
									name="address.street"
									placeholder={t("common:street")}
									label={t("common:street")}
								/>
								<Form.Input<TOrder>
									name="address.streetNumber"
									placeholder={t("common:streetNumber")}
									label={t("common:streetNumber")}
								/>
								<Form.Input<TOrder>
									name="address.floor"
									placeholder={t("common:floor")}
									label={t("common:floor")}
								/>
								<Form.Input<TOrder>
									name="address.apartmentNumber"
									placeholder={t("common:apartmentNumber")}
									label={t("common:apartmentNumber")}
								/>
							</div>
						</div>
					</div>
					<div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
						<PaymentSummary>
							<div className="space-y-3">
								<Button fullWidth type="submit">
									{t("checkout:order")}
								</Button>
							</div>
						</PaymentSummary>
					</div>
				</div>
			</Form>
		</section>
	);
}

export default CheckoutPage;
