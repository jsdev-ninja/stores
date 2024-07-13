import { Button } from "src/components/Button/Button";
import AcmeLogo from "../../assets/logo.png";
import { navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { Icon } from "src/components";

export function AppBar() {
	const { t } = useTranslation();

	const user = useAppSelector((state) => state.user.user);

	const text = user && !user.isAnonymous ? t("logout") : t("login");

	const onClick =
		user && !user.isAnonymous
			? () => FirebaseApi.auth.logout()
			: () => modalApi.openModal("authModal");

	function navigateToProfile() {
		navigate("store.profile");
	}

	return (
		<div className="shadow px-4 py-2 flex items-center h-16">
			<div className="h-[40px] w-[80px]">
				<img
					src={AcmeLogo}
					alt=""
					onClick={() => {
						navigate("store");
					}}
				/>
			</div>
			<div className="ms-auto">
				{!!user && !user.isAnonymous ? (
					<div className="">
						<Icon onClick={navigateToProfile} name="userCircle" size="lg" />
					</div>
				) : (
					<Button onClick={onClick}>{text}</Button>
				)}
			</div>
		</div>
	);
}
