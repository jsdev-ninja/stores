/**
 * Balasi storefront catalog page — Balasi design port.
 * Wraps real Algolia products (ProductsWidget → ProductRender) and real
 * category filtering (CategoryMenu) inside the new catalog layout.
 *
 * Sidebar "תזונה וכשרות" and "יצרנים" blocks are STATIC placeholder UI —
 * no such filter data exists in the backend.  Sort Select is LOCAL/UI-ONLY
 * at this time; wiring to Algolia custom ranking is left as a future task.
 *
 * Layout: RTL flex row — the cart column is the LAST child so it renders on
 * the LEFT (RTL end), matching the default catalog. `sticky` (not `fixed`,
 * which can resolve against a transformed ancestor and flip sides).
 */

import { getCartCost } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { ProductRender } from "src/components/renders/ProductRender/ProductRender";
import { useCart } from "src/domains/cart";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";
import { useStoreActions } from "src/infra";
import { formatter } from "src/utils/formatter";
import { Cart } from "src/widgets/Cart/Cart";
import { ProductsWidget } from "src/widgets/Products";
import { useCatalogAside } from "./useCatalogAside";
import { CatalogAside } from "./catalog/CatalogAside";
import { CatalogRowHead } from "./catalog/CatalogRowHead";

export default function BalasiCatalogPage() {
	const { t } = useTranslation(["common"]);
	const store = useStore();
	const cart = useCart();
	const discounts = useDiscounts();
	const actions = useStoreActions();
	const { isAsideOpen, toggleAside, closeAside } = useCatalogAside();

	const openCart = () => actions.dispatch(actions.ui.openCartDrawer());

	if (!store) return null;

	const cartCost = getCartCost({
		cart: cart?.items ?? [],
		discounts,
		deliveryPrice: store.deliveryPrice,
		freeDeliveryPrice: store.freeDeliveryPrice,
		isVatIncludedInPrice: store.isVatIncludedInPrice,
	});

	return (
		<div className="min-h-screen bg-[var(--background)]" dir="rtl">
			<div className="flex w-full items-start">
				{/* Main content — to the RIGHT of the cart in RTL */}
				<div className="grow min-w-0">
					<ProductsWidget>
						<section className="py-10 lg:py-16">
							<div className="container mx-auto px-4">
								{/* Row head: title + sort select */}
								<CatalogRowHead />

								{/* Mobile filter toggle */}
								<button
									className="lg:hidden mb-4 inline-flex items-center gap-2.5 border-[1.5px] border-[var(--foreground)] bg-[var(--foreground)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--surface)] transition-colors hover:bg-[var(--accent)] hover:border-[var(--accent)]"
									onClick={toggleAside}
									aria-label="הצג סינונים"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
										<line x1="4" y1="6" x2="20" y2="6" />
										<line x1="4" y1="12" x2="20" y2="12" />
										<line x1="4" y1="18" x2="20" y2="18" />
									</svg>
									<span>סינונים</span>
								</button>

								{/* Catalog layout: aside + product grid */}
								<div className="flex gap-8 items-start">
									{/* Sidebar: categories + static filters + help promo */}
									<CatalogAside isOpen={isAsideOpen} onClose={closeAside} />

									{/* Catalog main area */}
									<div className="min-w-0 flex-1 flex flex-col gap-5">
										<ProductsWidget.SearchBox />

										<div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 w-full">
											<ProductsWidget.Products emptyStateAction={() => {}}>
												{(products) =>
													products.map((product) => (
														<div key={product.id} className="w-full min-w-0 flex justify-center">
															<ProductRender product={product} />
														</div>
													))
												}
											</ProductsWidget.Products>
										</div>
									</div>
								</div>
							</div>
						</section>
					</ProductsWidget>
				</div>

				{/* Desktop cart — LAST child → LEFT in RTL. Sticky, not fixed. */}
				<aside className="hidden xl:flex w-80 shrink-0 sticky top-[64px] h-[calc(100vh-64px)] flex-col z-30 border-s border-[var(--border)] bg-[var(--surface)]">
					<div className="grow h-full overflow-auto">
						<Cart />
					</div>
					<div className="p-4 shrink-0 border-t border-[var(--border)]">
						<Button
							isDisabled={!cartCost?.items?.length}
							fullWidth
							onPress={openCart}
							variant="primary"
						>
							{t("common:goToCart")} {formatter.price(cartCost.cost)}
						</Button>
					</div>
				</aside>
			</div>

			{/* Mobile sticky cart bar */}
			<div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[var(--background)] border-t border-[var(--border)] shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
				<Button
					isDisabled={!cartCost?.items?.length}
					fullWidth
					size="lg"
					onPress={openCart}
				>
					{t("common:goToCart")} {formatter.price(cartCost.cost)}
				</Button>
			</div>
			{/* Spacer so content is not hidden behind mobile cart bar */}
			<div className="xl:hidden h-16 shrink-0" aria-hidden />
		</div>
	);
}
