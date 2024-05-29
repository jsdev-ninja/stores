import { cartSlice } from "src/domains/Cart";
import { useAppSelector } from "src/infra/store";

export function PaymentSummary() {
	const cartCost = useAppSelector(cartSlice.selectors.selectCost);
	console.log("cartCost", cartCost);
	return (
		<div className="p-4">
			<div className="">Total</div>

			<div className="flex flex-col gap-3 mt-4">
				<LineItem label={"products"} value={cartCost.cost} />
				<LineItem label={"Discount"} value={cartCost.discount} />
				<LineItem label={"final cost"} value={cartCost.finalCost} />
			</div>
		</div>
	);
}

function LineItem({ label, value }) {
	return (
		<div className="flex items-center justify-between">
			<div className="">{label}</div>
			<div className="">{value}</div>
		</div>
	);
}
