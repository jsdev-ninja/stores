import { Badge, Card, CardBody, CardFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Button } from "src/components/button";
import { useDiscounts } from "src/domains/Discounts/Discounts";

export default function DiscountsPage() {
	const discounts = useDiscounts();

	console.log("discounts", discounts);

	return (
		<section className="py-12 px-4 max-w-7xl mx-auto">
			{/* Add bundle offer banner */}
			<Card className="mb-8 bg-primary-100 border-none">
				{/* <CardBody className="flex items-center justify-between py-4">
					<div className="flex items-center gap-4">
						<Icon icon="lucide:tag" className="text-2xl text-primary-500" />
						<div>
							<h3 className="text-lg font-bold text-primary-600">Special Bundle Offer!</h3>
							<p className="text-primary-600">
								Buy 3 items, pay for 2 - Save {bundleOffer.savings}% on the bundle
							</p>
						</div>
					</div>
					<Badge color="primary" variant="flat" content={`${di.savings}% OFF`} />
				</CardBody> */}
			</Card>

			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-bold text-default-900">Special Discounts</h2>
				<Button
					variant="light"
					color="primary"
					endContent={<Icon icon="lucide:arrow-right" className="ml-2" />}
				>
					View All Deals
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{discounts.map((discount) => (
					<Card key={discount.id} isPressable className="border border-default-200">
						<CardBody className="p-0 relative">
							<Badge
								content={`-${discount.variant.discountPrice}%`}
								color="danger"
								placement="top-right"
								className="m-2"
							>
								<img
									src={"https://img.heroui.chat/image/shoes?w=400&h=400&u=1"}
									alt={""}
									className="w-full h-48 object-cover"
								/>
							</Badge>
						</CardBody>
						<CardFooter className="flex flex-col items-start gap-2">
							<h3 className="font-semibold text-default-900">{discount.name[0].value}</h3>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-3">
									<span className="text-danger-600 font-bold">
										${discount.variant.discountPrice}
									</span>
									<span className="text-default-400 line-through text-sm">
										${discount.variant.discountPrice}
									</span>
								</div>
								<div className="text-sm text-success-600 font-medium">
									${discount.variant.discountPrice} each when buying{" "}
									{discount.variant.requiredQuantity}
								</div>
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
