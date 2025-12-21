import { Route } from "src/navigation";
import { AddProductPage } from "../AddProductPage";
import { AdminProductsPage } from "../AdminProductsPage";
import { AdminCategoriesPages } from "../AdminCategoriesPages";
import { AddCategoryPage } from "../AddCategoryPage";
import { EditProductPage } from "../EditProductPage/EditProductPage";
import AdminOrdersPages from "../Orders/AdminOrdersPages";
import AdminSettingsPage from "../AdminSettingsPage";
import AdminHomePage from "../AdminHomePage";
import AdminUsersPage from "../AdminUsersPage";
import AdminOrderPage from "../Orders/AdminOrderPage";
import AdminDiscountsPage from "../AdminDiscountsPage";
import AdminClientProfile from "../AdminClientProfile/AdminClientProfile";
import { AdminOrganizationsPage } from "../AdminOrganizationsPage";
import { AdminOrganizationDetailPage } from "../AdminOrganizationDetailPage/AdminOrganizationDetailPage";
import { AdminOrganizationGroupsPage } from "../AdminOrganizationGroupsPage";
import { useEffect, useRef, useState } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import AdminCreateOrderPage from "../AdminCreateOrderPage/AdminCreateOrderPage";
import AdminInvoicesPage from "../AdminInvoicesPage/AdminInvoicesPage";
import { useAppApi } from "src/appApi";
import { OrganizationSlice } from "src/domains/Organization";
import { useAppDispatch } from "src/infra";

export default function AdminLayout() {
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const mainRef = useRef<HTMLDivElement>(null);

	const appApi = useAppApi();
	const dispatch = useAppDispatch();
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setIsMenuOpen(false);
			} else {
				setIsMenuOpen(true);
			}
		};

		// Set initial state
		handleResize();

		// Add event listener
		window.addEventListener("resize", handleResize);

		// Cleanup
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		appApi.admin.listOrganizations().then((response) => {
			console.log("response", response);

			if (response?.success && response.data) {
				dispatch(OrganizationSlice.actions.setOrganizations(response.data));
			}
		});
	}, []);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	return (
		<>
			<Header toggleMenu={toggleMenu} />
			<div className="flex flex-1 overflow-hidden relative w-full">
				{/* Overlay for mobile menu */}
				{isMenuOpen && window.innerWidth < 1024 && (
					<div
						className="sidebar-overlay lg:hidden"
						onClick={() => setIsMenuOpen(false)}
					></div>
				)}

				<Sidebar isOpen={isMenuOpen} />
				<main
					ref={mainRef}
					className={`flex-1 overflow-auto p-4 md:p-6 main-content-transition w-full ${
						isMenuOpen ? "lg:ms-64" : "lg:ms-16"
					}`}
					style={{
						width: "100%", // Remove the problematic inline width calculation
					}}
				>
					<Route name="admin" index>
						<AdminHomePage />
					</Route>
					<Route name="admin.addProduct">
						<AddProductPage />
					</Route>
					<Route name="admin.editProduct">
						<EditProductPage />
					</Route>
					<Route name="admin.products">
						<AdminProductsPage />
					</Route>
					<Route name="admin.productsByCategory">
						<AdminProductsPage />
					</Route>
					<Route name="admin.categories">
						<AdminCategoriesPages />
					</Route>
					<Route name="admin.addCategory">
						<AddCategoryPage />
					</Route>
					<Route name="admin.orders">
						<AdminOrdersPages />
					</Route>
					<Route name="admin.order">
						<AdminOrderPage />
					</Route>
					<Route name="admin.settings">
						<AdminSettingsPage />
					</Route>
					<Route name="admin.discounts">
						<AdminDiscountsPage />
					</Route>
					<Route name="admin.users">
						<AdminUsersPage />
					</Route>
					<Route name="admin.createOrder">
						<AdminCreateOrderPage />
					</Route>
					<Route name="admin.clientProfile">
						<AdminClientProfile />
					</Route>
					<Route name="admin.organizations">
						<AdminOrganizationsPage />
					</Route>
					<Route name="admin.organization">
						<AdminOrganizationDetailPage />
					</Route>
					<Route name="admin.organizationGroups">
						<AdminOrganizationGroupsPage />
					</Route>
					<Route name="admin.invoices">
						<AdminInvoicesPage />
					</Route>
				</main>
			</div>
		</>
	);
}
