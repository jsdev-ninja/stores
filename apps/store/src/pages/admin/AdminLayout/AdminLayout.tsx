import { Route, useLocation } from "src/navigation";
import { AddProductPage } from "../AddProductPage";
import { AdminProductsPage } from "../AdminProductsPage";
import { AdminCategoriesPages } from "../AdminCategoriesPages";
import { AddCategoryPage } from "../AddCategoryPage";
import { EditProductPage } from "../EditProductPage/EditProductPage";
import AdminSettingsPage from "../AdminSettingsPage";
import AdminHomePage from "../AdminHomePage";
import AdminUsersPage from "../AdminUsersPage";
import AdminDiscountsPage from "../AdminDiscountsPage";
import AdminClientProfile from "../AdminClientProfile/AdminClientProfile";
import { AdminOrganizationsPage } from "../AdminOrganizationsPage";
import { AdminOrganizationDetailPage } from "../AdminOrganizationDetailPage/AdminOrganizationDetailPage";
import { AdminOrganizationGroupsPage } from "../AdminOrganizationGroupsPage";
import { AdminSuppliersPage } from "../AdminSuppliersPage";
import { useEffect, useState } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useNewOrdersCount } from "./useNewOrdersCount";
import AdminCreateOrderPage from "../AdminCreateOrderPage/AdminCreateOrderPage";
import AdminInvoicesPage from "../AdminInvoicesPage/AdminInvoicesPage";
import AdminDeliveryNotesPage from "../AdminDeliveryNotesPage/AdminDeliveryNotesPage";
import { AdminInventoryCertificatePage } from "../AdminInventoryCertificatePage";
import { AdminInventoryCertificateDetailPage } from "../AdminInventoryCertificateDetailPage";
import { AdminBudgetPage, AdminBudgetOrganizationPage } from "../AdminBudgetPage/AdminBudgetPage";
import { useAppApi } from "src/appApi";
import { OrganizationSlice } from "src/domains/Organization";
import { useAppDispatch } from "src/infra";

import AdminOrdersPage from "../Orders/AdminOrdersPage";
import AdminOrderPageNew from "../Orders/AdminOrderPageNew";
import AdminOrderPickPage from "../Orders/AdminOrderPickPage";


export default function AdminLayout() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [location] = useLocation();

	const appApi = useAppApi();
	const dispatch = useAppDispatch();

	const { count: newOrdersCount, markSeen } = useNewOrdersCount();

	useEffect(() => {
		appApi.admin.listOrganizations().then((response) => {
			if (response?.success && response.data) {
				dispatch(OrganizationSlice.actions.setOrganizations(response.data));
			}
		});
	}, []);

	// Close the mobile drawer whenever the route changes.
	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [location.pathname]);

	// Viewing the orders screen clears the "new orders" badge.
	useEffect(() => {
		if (location.pathname === "/admin/orders") {
			markSeen();
		}
	}, [location.pathname, markSeen]);

	return (
		<div className="flex min-h-screen bg-[var(--background)]" dir="rtl">
			<Sidebar isOpen={isMobileMenuOpen} newOrdersCount={newOrdersCount} />

			{/* Mobile backdrop — only below lg, only while the drawer is open. */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setIsMobileMenuOpen(false)}
					aria-hidden="true"
				/>
			)}

			<div className="flex flex-1 flex-col min-w-0">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} />
				<main className="flex-1 p-4 lg:p-8">
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
						<AdminOrdersPage />
					</Route>
					<Route name="admin.order">
						<AdminOrderPageNew />
					</Route>
					<Route name="admin.pickOrder">
						<AdminOrderPickPage />
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
					<Route name="admin.suppliers">
						<AdminSuppliersPage />
					</Route>
					<Route name="admin.invoices">
						<AdminInvoicesPage />
					</Route>
					<Route name="admin.deliveryNotes">
						<AdminDeliveryNotesPage />
					</Route>
					<Route name="admin.inventoryCertificate">
						<AdminInventoryCertificatePage />
					</Route>
					<Route name="admin.inventoryCertificateDetail">
						<AdminInventoryCertificateDetailPage />
					</Route>
					<Route name="admin.budget">
						<AdminBudgetPage />
					</Route>
					<Route name="admin.budgetOrganization">
						<AdminBudgetOrganizationPage />
					</Route>
				</main>
			</div>
		</div>
	);
}
