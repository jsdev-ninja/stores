import { Button } from "src/components/Button/Button";
import { cartSlice } from "src/domains/Cart";
import { useAppSelector } from "src/infra/store";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { PaymentSummary } from "src/widgets/PaymentSummary";

export function CartPage() {
	const cartCost = useAppSelector(cartSlice.selectors.selectCost);
	console.log("cartCost", cartCost);

	return (
		<div className="flex-grow border-4 flex flex-col  sm:container sm:mx-auto">
			<div className="w-full mx-auto flex border  flex-grow">
				<div className="w-3/5">
					<Cart />
				</div>
				<div className="w-96 mx-auto border bg-gray-50 flex flex-col">
					<PaymentSummary />
					<div className="p-4">
						<Button fullWidth onClick={() => navigate("store.cart")}>
							Go to cart
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
