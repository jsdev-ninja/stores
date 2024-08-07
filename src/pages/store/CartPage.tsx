import { Button } from "src/components/Button/Button";
import { navigate } from "src/navigation";
import { Cart } from "src/widgets/Cart/Cart";
import { PaymentSummary } from "src/widgets/PaymentSummary";

export function CartPage() {
	return (
		<div className="flex-grow  flex flex-col  sm:container sm:mx-auto">
			<div className="w-full mx-auto flex   flex-grow">
				<div className="w-3/5">
					<Cart size="lg" />
				</div>
				<div className="w-96 mx-auto  bg-gray-50 flex flex-col">
					<PaymentSummary />
					<div className="p-4">
						<Button fullWidth onClick={() => navigate("store.checkout")}>
							Go to checkout
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
