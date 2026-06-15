import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Input } from "@heroui/react";
import algoliasearch from "algoliasearch/lite";
import {
	getCartCost,
	TOrder,
	TProduct,
	TCartItemProduct,
	TFulfillmentStatus,
} from "@jsdev_ninja/core";
import { Button } from "src/components/button";
import { formatter } from "src/utils/formatter";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";

const algoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
const productsIndex = algoliaClient.initIndex("products");

function itemUnitPrice(it: TCartItemProduct): number {
	return it.finalPrice || it.originalPrice || it.product.price || 0;
}
function itemName(it: TCartItemProduct): string {
	return it.product.name?.[0]?.value || "—";
}

// Weight/measured products (kg, gram, liter, ml) are picked by a fractional
// amount (e.g. 1.25 kg); only "unit" products are whole-number. Missing
// priceType falls back to unit behaviour. Mirrors the weight handling in
// OrderEditModal so picking can capture the actually-weighed amount.
const WEIGHT_STEP = 0.5;
const WEIGHT_MIN = 0.01;

function isWeightProduct(p: TProduct): boolean {
	const type = p.priceType?.type;
	return !!type && type !== "unit";
}
function isWeightItem(it: TCartItemProduct): boolean {
	return isWeightProduct(it.product);
}
// Round to 3 decimals to keep weights clean and avoid float drift.
function roundQty(n: number): number {
	return Math.round(n * 1000) / 1000;
}

/**
 * Quantity field that accepts a typed decimal weight (e.g. "1.25"). A plain
 * controlled number input drops a trailing "." on each keystroke, so this keeps
 * a local text buffer while focused and commits a clamped number on blur. The
 * +/- buttons drive `value` from the parent, which re-syncs the text when idle.
 * Same component as OrderEditModal.
 */
function QtyInput({
	value,
	weight,
	onCommit,
}: {
	value: number;
	weight: boolean;
	onCommit: (n: number) => void;
}) {
	const [text, setText] = useState(String(value));
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setText(String(value));
	}, [value, focused]);

	function commit() {
		const min = weight ? WEIGHT_MIN : 1;
		const parsed = parseFloat(text);
		let next = Number.isFinite(parsed) ? parsed : min;
		next = weight ? roundQty(next) : Math.round(next);
		next = Math.max(min, next);
		onCommit(next);
		setText(String(next));
	}

	return (
		<input
			type="text"
			inputMode="decimal"
			value={text}
			onClick={(e) => e.stopPropagation()}
			onFocus={() => setFocused(true)}
			onChange={(e) => {
				const raw = e.target.value;
				// Allow only digits and a single decimal point while typing.
				if (!/^\d*\.?\d*$/.test(raw)) return;
				setText(raw);
			}}
			onBlur={() => {
				setFocused(false);
				commit();
			}}
			className="w-12 text-center text-sm font-bold bg-white rounded-full outline-none"
		/>
	);
}

/**
 * Fullscreen warehouse picking screen (demo-style). Mark each line
 * delivered / missing / substituted (+ replacement product & qty). On save the
 * order's items carry their fulfillment status and cart.cartTotal becomes the
 * FULFILLED total (missing excluded, substitutions repriced) — so the later
 * charge / delivery note reflect what was actually delivered.
 */
export function OrderPickingModal({
	order,
	onSaved,
}: {
	order: TOrder;
	onSaved?: (order: TOrder) => void;
}) {
	const { t } = useTranslation(["common", "ordersPage"]);
	const appApi = useAppApi();
	const discounts = useDiscounts();
	const store = useStore();

	const [items, setItems] = useState<TCartItemProduct[]>(
		(order.cart.items ?? []).map((i) => ({ ...i })),
	);
	const [saving, setSaving] = useState(false);
	// Per-line product search (for substitution). Keyed by item index.
	const [searchFor, setSearchFor] = useState<number | null>(null);
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const close = () => modalApi.closeModal("orderPicking");

	function setStatus(idx: number, status: TFulfillmentStatus) {
		setItems((prev) =>
			prev.map((it, i) =>
				i === idx
					? { ...it, status, substitutedWith: status === "substituted" ? it.substitutedWith : null }
					: it,
			),
		);
		if (status === "substituted") setSearchFor(idx);
	}

	function setSubstitution(idx: number, product: TProduct) {
		setItems((prev) =>
			prev.map((it, i) =>
				i === idx
					? {
							...it,
							status: "substituted",
							substitutedWith: { product, amount: it.amount, price: product.price },
						}
					: it,
			),
		);
		setSearchFor(null);
		setSearchQuery("");
		setSearchResults([]);
	}

	// Picked quantity for the main line — weight products accept a decimal.
	function setQty(idx: number, amount: number) {
		setItems((prev) =>
			prev.map((it, i) => {
				if (i !== idx) return it;
				const min = isWeightItem(it) ? WEIGHT_MIN : 1;
				const next = isWeightItem(it) ? roundQty(amount) : Math.round(amount);
				return { ...it, amount: Math.max(min, next) };
			}),
		);
	}
	function changeQty(idx: number, delta: number) {
		setItems((prev) =>
			prev.map((it, i) => {
				if (i !== idx) return it;
				const min = isWeightItem(it) ? WEIGHT_MIN : 1;
				return { ...it, amount: Math.max(min, roundQty(it.amount + delta)) };
			}),
		);
	}

	function setSubQty(idx: number, amount: number) {
		setItems((prev) =>
			prev.map((it, i) => {
				if (i !== idx || !it.substitutedWith) return it;
				const weight = isWeightProduct(it.substitutedWith.product);
				const min = weight ? WEIGHT_MIN : 1;
				const next = weight ? roundQty(amount) : Math.round(amount);
				return {
					...it,
					substitutedWith: { ...it.substitutedWith, amount: Math.max(min, next) },
				};
			}),
		);
	}
	function changeSubQty(idx: number, delta: number) {
		setItems((prev) =>
			prev.map((it, i) => {
				if (i !== idx || !it.substitutedWith) return it;
				const weight = isWeightProduct(it.substitutedWith.product);
				const min = weight ? WEIGHT_MIN : 1;
				const next = Math.max(min, roundQty(it.substitutedWith.amount + delta));
				return { ...it, substitutedWith: { ...it.substitutedWith, amount: next } };
			}),
		);
	}

	function markAllDelivered() {
		setItems((prev) => prev.map((it) => ({ ...it, status: "delivered", substitutedWith: null })));
	}

	async function searchProducts(query: string) {
		setSearchQuery(query);
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		// Tenant isolation: NEVER search the index unscoped — always filter by the
		// order's storeId + companyId, or results leak across stores/companies.
		const { hits } = await productsIndex.search<TProduct>(query, {
			filters: `storeId:${order.storeId} AND companyId:${order.companyId}`,
			hitsPerPage: 6,
		});
		setSearchResults(hits);
	}

	// Fulfilled cart: drop missing, swap substituted → replacement product.
	function fulfilledCost() {
		const effective = items
			.filter((i) => i.status !== "missing")
			.map((i) =>
				i.status === "substituted" && i.substitutedWith
					? {
							...i,
							product: i.substitutedWith.product,
							amount: i.substitutedWith.amount,
							finalPrice: i.substitutedWith.price,
							originalPrice: i.substitutedWith.price,
						}
					: i,
			);
		return getCartCost({
			cart: effective,
			discounts,
			deliveryPrice:
				store?.deliveryPrice ?? order.storeOptions?.deliveryPrice ?? order.cart.deliveryPrice ?? 0,
			freeDeliveryPrice: store?.freeDeliveryPrice ?? order.storeOptions?.freeDeliveryPrice ?? 0,
			isVatIncludedInPrice:
				store?.isVatIncludedInPrice ?? order.storeOptions?.isVatIncludedInPrice ?? false,
		});
	}

	async function save() {
		setSaving(true);
		try {
			const cost = fulfilledCost();
			const updated: TOrder = {
				...order,
				cart: {
					...order.cart,
					items, // keep originals WITH status/substitutedWith for the record
					cartTotal: cost.finalCost,
					cartVat: cost.vat,
					cartDiscount: cost.discount,
					deliveryPrice: cost.deliveryPrice,
				},
			};
			const res = await appApi.admin.saveOrder({ order: updated });
			if (res?.success) {
				onSaved?.(updated);
				close();
			}
		} finally {
			setSaving(false);
		}
	}

	const total = items.length;
	const handled = items.filter((i) => i.status).length;
	const picked = items.filter((i) => i.status === "delivered").length;
	const missing = items.filter((i) => i.status === "missing").length;
	const substituted = items.filter((i) => i.status === "substituted").length;
	const progressPct = total > 0 ? Math.round((handled / total) * 100) : 0;
	const cost = fulfilledCost();

	const statusBtn = (
		idx: number,
		s: TFulfillmentStatus,
		label: string,
		activeCls: string,
	) => {
		const active = items[idx].status === s;
		return (
			<button
				type="button"
				onClick={() => setStatus(idx, s)}
				className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
					active ? activeCls : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
				}`}
			>
				{label}
			</button>
		);
	};

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<Modal.Container size="full" scroll="inside">
				<Modal.Dialog className="max-h-[100vh] flex flex-col">
					<Modal.Header>
						<Modal.Heading>
							<div className="flex items-center justify-between gap-4 w-full text-start">
								<div>
									<div className="text-lg font-bold">
										{t("ordersPage:picking.title", "מצב ליקוט")} #{order.id.slice(-8)}
									</div>
									<div className="text-sm text-gray-500">{order.client?.displayName}</div>
								</div>
							</div>
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 flex-1 min-h-0 overflow-y-auto">
						{/* Progress */}
						<div>
							<div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
								<div
									className="h-full bg-[#1b7a3d] transition-all"
									style={{ width: `${progressPct}%` }}
								/>
							</div>
							<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
								<span className="text-gray-600">
									{handled}/{total} {t("ordersPage:picking.handled", "פריטים טופלו")}
								</span>
								{picked > 0 && <span className="text-[#155f30]">✓ {picked} נלקטו</span>}
								{missing > 0 && <span className="text-[#a14a2c]">❌ {missing} חסרים</span>}
								{substituted > 0 && <span className="text-[#9a7600]">🔄 {substituted} הוחלפו</span>}
							</div>
						</div>

						{/* Item cards */}
						<div className="space-y-3">
							{items.map((it, idx) => {
								const struck = it.status === "missing" || it.status === "substituted";
								return (
									<div
										key={it.product.id || idx}
										className={`rounded-xl border p-3 sm:p-4 ${
											it.status === "missing"
												? "border-[#d97757] bg-[#fef8f5]"
												: it.status === "substituted"
													? "border-[#d4a217] bg-[#fffbef]"
													: it.status === "delivered"
														? "border-[#a8d4b6] bg-[#f3f8f4]"
														: "border-gray-200 bg-white"
										}`}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
													{idx + 1}
												</div>
												<div>
													<div
														className={`font-semibold ${struck ? "line-through text-gray-400" : ""}`}
													>
														{itemName(it)}
													</div>
													<div className="text-xs text-gray-500">
														{it.product.brand} · {formatter.price(itemUnitPrice(it))}
														{isWeightItem(it) ? ` / ${it.product.priceType?.type}` : ""}
													</div>
												</div>
											</div>
											<div className="text-end font-semibold whitespace-nowrap">
												{it.status === "missing"
													? formatter.price(0)
													: it.status === "substituted" && it.substitutedWith
														? formatter.price(it.substitutedWith.price * it.substitutedWith.amount)
														: formatter.price(itemUnitPrice(it) * it.amount)}
											</div>
										</div>

										{/* Picked quantity — weight products (kg/gram/...) accept a typed
										    decimal and step by 0.5; unit products step by 1. Hidden for
										    missing/substituted (substitute has its own qty below). */}
										{it.status !== "missing" && it.status !== "substituted" && (
											<div className="mt-3 flex items-center gap-2">
												<span className="text-sm text-gray-600">
													{t("ordersPage:picking.qty", "כמות")}:
												</span>
												<div className="inline-flex items-center rounded-full bg-gray-100 p-0.5">
													<button
														type="button"
														onClick={() => changeQty(idx, isWeightItem(it) ? -WEIGHT_STEP : -1)}
														className="h-7 w-7 rounded-full bg-white font-bold"
													>
														−
													</button>
													<QtyInput
														value={it.amount}
														weight={isWeightItem(it)}
														onCommit={(n) => setQty(idx, n)}
													/>
													<button
														type="button"
														onClick={() => changeQty(idx, isWeightItem(it) ? WEIGHT_STEP : 1)}
														className="h-7 w-7 rounded-full bg-white font-bold"
													>
														+
													</button>
												</div>
											</div>
										)}

										<div className="mt-3 flex gap-2">
											{statusBtn(idx, "delivered", "✓ נלקט", "border-[#1b7a3d] bg-[#e3f2e8] text-[#155f30]")}
											{statusBtn(idx, "missing", "❌ חסר", "border-[#d97757] bg-[#fdebe0] text-[#a14a2c]")}
											{statusBtn(idx, "substituted", "🔄 החלף", "border-[#d4a217] bg-[#fff6d9] text-[#9a7600]")}
										</div>

										{/* Substitution */}
										{it.status === "substituted" && (
											<div className="mt-3 rounded-lg bg-[#f3f8f4] p-3">
												{it.substitutedWith ? (
													<div className="flex items-center justify-between gap-3 flex-wrap">
														<span className="text-sm text-[#155f30]">
															✓ {it.substitutedWith.product.name?.[0]?.value}
														</span>
														<label className="text-sm flex items-center gap-2">
															{t("ordersPage:picking.subQty", "כמות תחליף")}:
															<div className="inline-flex items-center rounded-full bg-gray-100 p-0.5">
																<button
																	type="button"
																	onClick={() =>
																		changeSubQty(
																			idx,
																			isWeightProduct(it.substitutedWith!.product) ? -WEIGHT_STEP : -1,
																		)
																	}
																	className="h-7 w-7 rounded-full bg-white font-bold"
																>
																	−
																</button>
																<QtyInput
																	value={it.substitutedWith.amount}
																	weight={isWeightProduct(it.substitutedWith.product)}
																	onCommit={(n) => setSubQty(idx, n)}
																/>
																<button
																	type="button"
																	onClick={() =>
																		changeSubQty(
																			idx,
																			isWeightProduct(it.substitutedWith!.product) ? WEIGHT_STEP : 1,
																		)
																	}
																	className="h-7 w-7 rounded-full bg-white font-bold"
																>
																	+
																</button>
															</div>
														</label>
														<button
															type="button"
															className="text-xs text-gray-500 underline"
															onClick={() => setSearchFor(idx)}
														>
															{t("ordersPage:picking.changeSub", "שנה מוצר")}
														</button>
													</div>
												) : null}

												{searchFor === idx && (
													<div className="mt-2">
														<Input
															placeholder={t("ordersPage:picking.searchProduct", "חפש מוצר תחליף…")}
															value={searchQuery}
															onChange={(e) => searchProducts(e.target.value)}
															autoFocus
														/>
														{searchResults.length > 0 && (
															<div className="mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white">
																{searchResults.map((p) => (
																	<button
																		key={p.id}
																		type="button"
																		onClick={() => setSubstitution(idx, p)}
																		className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-start"
																	>
																		<span>{p.name?.[0]?.value}</span>
																		<span className="text-gray-500">{formatter.price(p.price)}</span>
																	</button>
																))}
															</div>
														)}
													</div>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<div className="flex w-full items-center justify-between gap-3 flex-wrap">
							<div className="flex items-center gap-3">
								<Button variant="ghost" onPress={markAllDelivered}>
									{t("ordersPage:picking.markAll", "✓ סמן הכל כנלקט")}
								</Button>
								<span className="text-sm text-gray-600">
									{t("ordersPage:picking.fulfilledTotal", "סה״כ לאחר ליקוט")}:{" "}
									<b>{formatter.price(cost.finalCost)}</b>
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Button variant="ghost" onPress={close}>
									{t("common:cancel", "ביטול")}
								</Button>
								<Button
									variant="primary"
									isPending={saving}
									isDisabled={handled === 0}
									onPress={save}
								>
									{t("ordersPage:picking.save", "סיום ליקוט · שמור")}
								</Button>
							</div>
						</div>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
