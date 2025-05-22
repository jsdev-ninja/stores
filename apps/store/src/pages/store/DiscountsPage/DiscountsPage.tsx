import { Card, CardBody, CardFooter } from "@heroui/react";
import { useDiscounts } from "src/domains/Discounts/Discounts";

export default function DiscountsPage() {
	const discounts = useDiscounts();

	console.log("discounts", discounts);

	return (
		<section className="py-12 px-4 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-bold text-default-900">מצבעים</h2>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{discounts.map((discount) => (
					<Card key={discount.id} isPressable className="border border-default-200 w-52">
						<CardBody className="p-0 relative">
							{/* <Badge
								content={`-${discount.variant.discountPrice}%`}
								color="danger"
								placement="top-right"
								className="m-2"
							>
								<img
									src={"No-Image-Placeholder.png"}
									alt={""}
									className="w-full h-48 object-cover"
								/>

							</Badge> */}
							<img
								src={"No-Image-Placeholder.png"}
								alt={""}
								className="w-full h-48 object-cover"
							/>
						</CardBody>
						<CardFooter className="flex flex-col items-start gap-2">
							<h3 className="font-semibold text-default-900">{discount.name[0].value}</h3>
							<div className="flex flex-col gap-1">
								{/* <div className="flex items-center gap-3">
									<span className="text-danger-600 font-bold">
										${discount.variant.discountPrice}
									</span>
									<span className="text-default-400 line-through text-sm">
										${discount.variant.discountPrice}
									</span>
								</div>
								<div className="text-sm text-success-600 font-medium">
									{discount.variant.discountPrice} תקנה ב
									{discount.variant.requiredQuantity}
								</div> */}
							</div>
							{/* <Button
								fullWidth
								color="primary"
								variant="flat"
								startContent={<Icon icon="lucide:shopping-cart" />}
								onPress={() => setSelectedProduct(product)}
							>
								Add to Bundle
							</Button> */}
						</CardFooter>
					</Card>
				))}
			</div>
		</section>
	);
}
