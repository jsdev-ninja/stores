import { navigate } from "src/navigation";
import DefaultLogoSrc from "../../assets/default_logo.png";
import { useStore } from "src/domains/Store";

export function WebsiteLogo() {
	const store = useStore();
	return (
		<img
			src={store?.logoUrl || DefaultLogoSrc}
			alt=""
			className="w-full h-full rounded object-contain"
			onClick={() => {
				navigate({
					to: "store",
				});
			}}
		/>
	);
}
