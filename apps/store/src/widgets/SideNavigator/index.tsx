import { ProductsWidget } from "../Products";

export const SideNavigator = () => {
	return (
		<div id="SideNavigator" className="flex-grow max-h-full">
			<ProductsWidget.Filter />
		</div>
	);
};
