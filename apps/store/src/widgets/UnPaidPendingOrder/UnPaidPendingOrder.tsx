import { Button } from "@heroui/react";

export function UnPaidPendingOrder() {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<div className="shadow p-4 min-h-96">
				<div className="">UnPaidPendingOrder</div>
				<div className="">UnPaidPendingOrder</div>
				<div className="flex flex-col gap-4 mt-6">
					<Button color="primary">Continue order</Button>
					<Button color="secondary">View order</Button>
					<Button color="danger" variant="bordered">
						Cancel Order
					</Button>
				</div>
			</div>
		</div>
	);
}
