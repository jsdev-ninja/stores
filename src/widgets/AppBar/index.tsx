import { Button } from "src/components/Button/Button";
import AcmeLogo from "../../assets/logo.png";
import { navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";

export function AppBar() {
	const { t } = useTranslation();
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
				<Button onClick={() => modalApi.openModal("authModal")}>{t("login")}</Button>
			</div>
		</div>
	);
}
