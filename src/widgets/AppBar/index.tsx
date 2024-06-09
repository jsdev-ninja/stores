import { Button } from "src/components/Button/Button";
import AcmeLogo from "../../assets/logo.png";
import { navigate } from "src/navigation";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";

export function AppBar() {
	const { t } = useTranslation();
	return (
		<div className="shadow p-4 flex items-center">
			<div className="h-[48px] w-[96px]">
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
