import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { OrderApi } from "src/domains/Order";
import { AddressSchema, TAddress, useAppSelector } from "src/infra";
import { PaymentSummary } from "src/widgets/PaymentSummary";

function CheckoutPage() {
	const { t } = useTranslation(["common", "checkout"]);

	const cart = useAppSelector((state) => state.cart.cart);
	const store = useAppSelector((state) => state.store.data);

	if (!store) {
		return null; // todo
	}

	return (
		<Form<TAddress>
			schema={AddressSchema}
			onSubmit={async (data) => {
				console.log("data", data);
				const response = await OrderApi.createOrder({
					cart: cart.items,
					companyId: store.companyId,
					status: "pending",
					storeId: store.id,
					paymentStatus: "notPaid",
					date: Date.now(),
				});
				console.log("response", response);
			}}
			className="flex-grow  flex flex-col  sm:container sm:mx-auto"
		>
			<div className="w-full mx-auto flex   flex-grow">
				<div className="w-3/5">
					<div className="text-4xl font-semibold">{t("checkout:title")}</div>
					<div className="my-4">payment details</div>
					<div className="">
						<div className="flex flex-col gap-4">
							<Form.Field<TAddress> name="city" label={t("common:city")} />
							<Form.Field<TAddress> name="street" label={t("common:street")} />
						</div>
					</div>
				</div>
				<div className="w-96 mx-auto  bg-gray-50 flex flex-col">
					<PaymentSummary />
					<div className="p-4">
						<Form.Submit fullWidth>order</Form.Submit>
					</div>
				</div>
			</div>
		</Form>
	);
}

export default CheckoutPage;
