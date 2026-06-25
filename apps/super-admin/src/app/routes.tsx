import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "src/shell/AppShell";
import { OrdersListPage } from "src/entities/orders/OrdersListPage";
import { OrderDetailPage } from "src/entities/orders/OrderDetailPage";
import { ProductsListPage } from "src/entities/products/ProductsListPage";
import { ProductDetailPage } from "src/entities/products/ProductDetailPage";
import { ProfilesListPage } from "src/entities/profiles/ProfilesListPage";
import { ProfileDetailPage } from "src/entities/profiles/ProfileDetailPage";
import { AuditLogPage } from "src/audit/AuditLogPage";

// ─── Placeholder pages ────────────────────────────────────────────────────────

function DashboardPage() {
	return <div className="text-slate-600">Dashboard — implemented in F4</div>;
}

// ─── Route table ──────────────────────────────────────────────────────────────

export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppShell />}>
				<Route index element={<DashboardPage />} />
				<Route path="orders">
					<Route index element={<OrdersListPage />} />
					<Route path=":id" element={<OrderDetailPage />} />
				</Route>
				<Route path="products">
					<Route index element={<ProductsListPage />} />
					<Route path=":id" element={<ProductDetailPage />} />
				</Route>
				<Route path="profiles">
					<Route index element={<ProfilesListPage />} />
					<Route path=":id" element={<ProfileDetailPage />} />
				</Route>
				<Route path="audit" element={<AuditLogPage />} />
				{/* Catch-all: redirect unknown paths to root */}
				<Route path="*" element={<Navigate replace to="/" />} />
			</Route>
		</Routes>
	);
}
