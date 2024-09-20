import { Button } from "src/components/button";
import { navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";
import { ProductsWidget } from "../Products";
import { Dropdown } from "src/components/Dropdown";
import { useAppApi } from "src/appApi";
import { WebsiteLogo } from "../WebsiteLogo";

export function AppBar() {
	const { t } = useTranslation();

	const appApi = useAppApi();

	const user = useAppSelector((state) => state.user.user);

	const text = user && !user.isAnonymous ? t("logout") : t("login");

	const onClick =
		user && !user.isAnonymous
			? () => FirebaseApi.auth.logout()
			: () => modalApi.openModal("authModal");

	function navigateToProfile() {
		navigate({
			to: "store.profile",
		});
	}

	return (
		<div className="shadow px-4 py-2 flex items-center h-16">
			<div className="h-[40px] w-[80px]">
				<WebsiteLogo />
			</div>
			<div className="mx-4  w-full">
				<ProductsWidget.SearchBox />
			</div>
			<div className="ms-auto">
				{!!user && !user.isAnonymous ? (
					<Dropdown>
						<Dropdown.Trigger>
							<div className="">
								<Icon onClick={navigateToProfile} name="userCircle" size="lg" />
							</div>
						</Dropdown.Trigger>
						<Dropdown.Content>
							{!!user.admin && (
								<Dropdown.Item
									onSelect={() =>
										navigate({
											to: "admin",
										})
									}
								>
									admin
								</Dropdown.Item>
							)}
							<Dropdown.Item
								onSelect={() =>
									navigate({
										to: "store.orders",
									})
								}
							>
								orders
							</Dropdown.Item>
							<Dropdown.Item onSelect={appApi.system.auth.logout}>logout</Dropdown.Item>
						</Dropdown.Content>
					</Dropdown>
				) : (
					<Button onClick={onClick}>{text}</Button>
				)}
			</div>
		</div>
	);
}
