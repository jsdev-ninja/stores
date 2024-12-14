import { Card } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { navigate } from "src/navigation";

function HomePage() {
	const { t } = useTranslation(["common", "homePage"]);

	const services = [
		{
			title: t("homePage:services.shipping.title"),
			description: t("homePage:services.shipping.description"),
			icon: "/delivery.svg",
		},
		{
			title: t("homePage:services.support.title"),
			description: t("homePage:services.support.description"),
			icon: "/sapport.svg",
		},
		{
			title: t("homePage:services.payment.title"),
			description: t("homePage:services.payment.description"),
			icon: "/shopping.svg",
		},
		{
			title: t("homePage:services.moneyBack.title"),
			description: t("homePage:services.moneyBack.description"),
			icon: "/package.svg",
		},
	] as const;

	return (
		<div className="container my-4 flex flex-col gap-6">
			<div className="h-[35vh] md:h-[70vh] flex gap-4">
				<div className="relative w-full">
					<img
						src="/banner.svg"
						alt="banner"
						className="bg-cover object-cover h-full w-full"
					/>
					<div className="border text-white p-4  absolute end-0 top-0 h-full flex flex-col justify-center items-end gap-6 w-full md:w-1/2">
						<div className="">{t("homePage:title")}</div>
						<div className="">{t("homePage:description")}</div>
						<Button
							color="primary"
							className="max-w-72"
							radius="full"
							fullWidth
							size="lg"
							variant="shadow"
							onPress={() =>
								navigate({
									to: "store.catalog",
								})
							}
						>
							{t("homePage:action")}
						</Button>
					</div>
				</div>
				<div className="hidden md:flex flex-col gap-4 h-full">
					<div className="flex-grow overflow-hidden">
						<img src="/bg1.svg" alt="banner" className="object-cover  w-full h-full" />
					</div>
					<div className="flex-grow overflow-hidden">
						<img src="/bg2.svg" alt="banner" className="w-full h-full object-cover" />
					</div>
				</div>
			</div>

			<Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
				{services.map((service) => {
					return (
						<div
							key={service.title}
							className="flex-grow gap-5 p-5 flex items-center justify-center"
						>
							<img src={service.icon} className="size-10" alt="service" />
							<div className="">
								<div className="font-semibold text-lg">{service.title}</div>
								<div className="text-gray-400">{service.description}</div>
							</div>
						</div>
					);
				})}
			</Card>

			<div className="">
				<div className="title">title</div>
				<div className="flex flex-wrap gap-4 justify-center">
					{services.map((service) => {
						return (
							<div className="w-52 flex flex-col gap-4 justify-center items-center border rounded">
								<img src={service.icon} className="w-full h-auto" alt="" />
								<div className="">category</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default HomePage;
