import { Link, Outlet, useLocation } from "react-router-dom";
import { CurrentStoreBanner } from "src/store-context/CurrentStoreBanner";
import { StoreSwitcher } from "src/store-context/StoreSwitcher";
import { useStoreContext } from "src/store-context/StoreContext";
import { useAppShell } from "./useAppShell";

// Routes that are global (not store-scoped) — render regardless of store selection.
const GLOBAL_ROUTES = ["/firestore"];

export function AppShell() {
	const { navItems, isActive } = useAppShell();
	const { currentStore, loading, error } = useStoreContext();
	const location = useLocation();
	const isGlobalRoute = GLOBAL_ROUTES.some((r) => location.pathname.startsWith(r));

	return (
		<div className="flex min-h-screen bg-slate-100">
			{/* Sidebar */}
			<aside className="w-56 min-h-screen bg-slate-900 flex flex-col py-7">
				<div className="px-5 pb-5 border-b border-slate-800 mb-3">
					<span className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
						Internal Tool
					</span>
					<span className="block text-sm font-semibold text-slate-100 leading-snug">
						Super-Admin Console
					</span>
				</div>

				<nav aria-label="Main navigation" className="flex-1 flex flex-col gap-0.5 px-2">
					{navItems.map((item) => (
						<Link
							key={item.path}
							to={item.path}
							className={[
								"block px-3 py-2 rounded-lg text-sm transition-colors",
								isActive(item.path)
									? "bg-blue-600 text-white font-medium"
									: "text-slate-400 hover:text-slate-100 hover:bg-slate-800",
							].join(" ")}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</aside>

			{/* Main area */}
			<div className="flex flex-col flex-1 min-w-0">
				{/* Header */}
				<header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
					<div className="flex-1">
						<CurrentStoreBanner />
					</div>
					<StoreSwitcher />
				</header>

				{/* Content */}
				<main className="flex-1 p-6">
					{loading && (
						<div className="flex items-center justify-center h-40">
							<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
						</div>
					)}

					{!loading && error && (
						<div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
							<p className="font-semibold mb-1">Failed to load stores</p>
							<p>{error}</p>
						</div>
					)}

					{!loading && !error && !currentStore && !isGlobalRoute && (
						<div className="flex flex-col items-center justify-center h-64 text-center">
							<p className="text-lg font-semibold text-slate-700 mb-2">
								No store selected
							</p>
							<p className="text-sm text-slate-500">
								Use the store switcher in the header to pick a store before
								browsing data.
							</p>
						</div>
					)}

					{!loading && !error && (currentStore || isGlobalRoute) && <Outlet />}
				</main>
			</div>
		</div>
	);
}
