import { Route, useLocation } from "src/navigation";
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
import { useEffect, useRef, useState } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export default function AdminLayout() {
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [location] = useLocation();
	const mainRef = useRef<HTMLDivElement>(null);

	// Close sidebar on route change on mobile devices
	useEffect(() => {
		if (window.innerWidth < 1024) {
			setIsMenuOpen(false);
		}
	}, [location.pathname]);

	// Update the initial state based on screen size
	useEffect(() => {
		const handleResize = () => {
			// On desktop (>= 1024px), we want the sidebar to be open by default
			// On mobile (< 1024px), we want it closed by default
			if (window.innerWidth >= 1024) {
				setIsMenuOpen(true);
			} else {
				setIsMenuOpen(false);
			}
		};

		// Initialize on mount
		handleResize();

		// Add resize listener
		window.addEventListener("resize", handleResize);

		// Cleanup
		return () => window.removeEventListener("resize", handleResize);
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
					<Route name="admin.clientProfile">
						<AdminClientProfile />
					</Route>
				</main>
			</div>
		</>
	);
}
