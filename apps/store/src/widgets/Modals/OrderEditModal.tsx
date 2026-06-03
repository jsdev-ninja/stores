import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Input } from "@heroui/react";
import algoliasearch from "algoliasearch/lite";
import {
	getCartCost,
	TOrder,
	TProduct,
	TCartItemProduct,
	TFulfillmentStatus,
	TOrganization,
} from "@jsdev_ninja/core";
import { Button } from "src/components/button";
import { formatter } from "src/utils/formatter";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useStore } from "src/domains/Store";

const algoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
const productsIndex = algoliaClient.initIndex("products");

const unit = (it: TCartItemProduct) => it.finalPrice || it.originalPrice || it.product.price || 0;
const nameOf = (it: TCartItemProduct) => it.product.name?.[0]?.value || "—";

function lineTotal(it: TCartItemProduct): number {
	if (it.status === "missing") return 0;
	if (it.status === "substituted" && it.substitutedWith)
		return it.substitutedWith.price * it.substitutedWith.amount;
	return unit(it) * it.amount;
}

/**
 * Edit-order modal (demo-style). Admin composition editing before approval:
 * qty steppers, add / remove items, per-line fulfillment status + substitution,
 * billing account, and notes. Saves items + fulfilled cart.cartTotal via updateOrder.
 */
export function OrderEditModal({
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
	const [notes, setNotes] = useState(order.clientComment ?? "");
	const [accountId, setAccountId] = useState(order.billingAccount?.id ?? "");
	const [orgs, setOrgs] = useState<TOrganization[]>([]);
	const [saving, setSaving] = useState(false);

	// Algolia search: add-item box + per-line substitution box. Inputs are
	// CONTROLLED (query state) so re-renders from results don't drop the text.
	const [addQuery, setAddQuery] = useState("");
	const [addResults, setAddResults] = useState<TProduct[]>([]);
	const [addOpen, setAddOpen] = useState(false);
	const [subFor, setSubFor] = useState<number | null>(null);
	const [subQuery, setSubQuery] = useState("");
	const [subResults, setSubResults] = useState<TProduct[]>([]);

	useEffect(() => {
		appApi.admin.listOrganizations().then((res) => {
			if (res?.success) setOrgs(res.data ?? []);
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const org = orgs.find((o) => o.id === order.organizationId);
	const accounts = org?.billingAccounts ?? [];
	const close = () => modalApi.closeModal("orderEdit");

	async function search(query: string, target: "add" | number) {
		target === "add" ? setAddQuery(query) : setSubQuery(query);
		if (!query.trim()) {
			target === "add" ? setAddResults([]) : setSubResults([]);
			return;
		}
		// Tenant isolation: NEVER search the index unscoped — always filter by the
		// order's storeId + companyId, or results leak across stores/companies.
		const { hits } = await productsIndex.search<TProduct>(query, {
			filters: `storeId:${order.storeId} AND companyId:${order.companyId}`,
			hitsPerPage: 6,
		});
		target === "add" ? setAddResults(hits) : setSubResults(hits);
	}

	function changeQty(idx: number, delta: number) {
		setItems((prev) =>
			prev.map((it, i) => (i === idx ? { ...it, amount: Math.max(1, it.amount + delta) } : it)),
		);
	}
	function removeItem(idx: number) {
		setItems((prev) => prev.filter((_, i) => i !== idx));
	}
	function addItem(product: TProduct) {
		setItems((prev) => [
			...prev,
			{
				product,
				amount: 1,
				finalPrice: product.price,
				originalPrice: product.price,
				status: "delivered",
			},
		]);
		setAddOpen(false);
		setAddQuery("");
		setAddResults([]);
	}
	function setStatus(idx: number, status: TFulfillmentStatus) {
		setItems((prev) =>
			prev.map((it, i) =>
				i === idx
					? { ...it, status, substitutedWith: status === "substituted" ? it.substitutedWith : null }
					: it,
			),
		);
		if (status === "substituted") setSubFor(idx);
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
		setSubFor(null);
		setSubQuery("");
		setSubResults([]);
	}
	function setSubQty(idx: number, amount: number) {
		setItems((prev) =>
			prev.map((it, i) =>
				i === idx && it.substitutedWith
					? { ...it, substitutedWith: { ...it.substitutedWith, amount: Math.max(1, amount) } }
					: it,
			),
		);
	}

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
			const account = accounts.find((a) => a.id === accountId);
			const updated: TOrder = {
				...order,
				clientComment: notes,
				...(account ? { billingAccount: account } : {}),
				cart: {
					...order.cart,
					items,
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

	const cost = fulfilledCost();

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<Modal.Container size="lg" scroll="inside" placement="center">
				<Modal.Dialog className="max-h-[85vh] flex flex-col">
					<Modal.Header>
						<Modal.Heading>
							<div className="text-start">
								{t("ordersPage:edit.title", "עריכת הזמנה")} #{order.id.slice(-8)}
							</div>
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 flex-1 min-h-0 overflow-y-auto">
						{/* Billing account + notes */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{accounts.length > 0 && (
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700 text-start">
										{t("ordersPage:edit.billingAccount", "חשבון לחיוב")}
									</label>
									<select
										value={accountId}
										onChange={(e) => setAccountId(e.target.value)}
										className="rounded-md border border-gray-200 px-3 py-2 text-sm"
									>
										<option value="">—</option>
										{accounts.map((a) => (
											<option key={a.id} value={a.id}>
												{a.name} ({a.number})
											</option>
										))}
									</select>
								</div>
							)}
							<div className="flex flex-col gap-1 sm:col-span-2">
								<label className="text-sm font-medium text-gray-700 text-start">
									{t("ordersPage:edit.notes", "הערות")}
								</label>
								<Input value={notes} onChange={(e) => setNotes(e.target.value)} />
							</div>
						</div>

						{/* Items */}
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-sm font-semibold">
								{t("ordersPage:edit.items", "פריטים בהזמנה")}
							</span>
							<Button variant="ghost" onPress={() => setAddOpen((v) => !v)}>
								{t("ordersPage:edit.addItem", "+ הוסף פריט")}
							</Button>
						</div>

						{addOpen && (
							<div className="rounded-md border border-gray-200 p-2">
								<Input
									placeholder={t("ordersPage:edit.searchProduct", "חפש מוצר להוספה…")}
									value={addQuery}
									onChange={(e) => search(e.target.value, "add")}
									autoFocus
								/>
								{addResults.length > 0 && (
									<div className="mt-1 max-h-48 overflow-auto rounded-md border border-gray-100">
										{addResults.map((p) => (
											<button
												key={p.id}
												type="button"
												onClick={() => addItem(p)}
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

						<div className="space-y-2">
							{items.map((it, idx) => {
								const struck = it.status === "missing" || it.status === "substituted";
								return (
									<div key={it.product.id || idx} className="rounded-lg border border-gray-200 p-3">
										<div className="flex items-center justify-between gap-3 flex-wrap">
											<div className="min-w-[40%]">
												<div className={`font-medium ${struck ? "line-through text-gray-400" : ""}`}>
													{nameOf(it)}
												</div>
												<div className="text-xs text-gray-500">
													{formatter.price(unit(it))} · {it.product.brand || ""}
													{it.status === "substituted" && it.substitutedWith
														? ` · 🔄 ${it.substitutedWith.product.name?.[0]?.value} × ${it.substitutedWith.amount}`
														: ""}
												</div>
											</div>
											<div className="flex items-center gap-2 flex-wrap">
												{/* qty stepper */}
												<div className="inline-flex items-center rounded-full bg-gray-100 p-0.5">
													<button
														type="button"
														onClick={() => changeQty(idx, -1)}
														className="h-6 w-6 rounded-full bg-white font-bold"
													>
														−
													</button>
													<span className="min-w-7 text-center text-sm font-bold">{it.amount}</span>
													<button
														type="button"
														onClick={() => changeQty(idx, 1)}
														className="h-6 w-6 rounded-full bg-white font-bold"
													>
														+
													</button>
												</div>
												{/* status dropdown */}
												<select
													value={it.status ?? "delivered"}
													onChange={(e) => setStatus(idx, e.target.value as TFulfillmentStatus)}
													className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
												>
													<option value="delivered">✅ זמין</option>
													<option value="missing">❌ חסר — הסר</option>
													<option value="substituted">🔄 חסר — החלף</option>
												</select>
												<span className="min-w-20 text-end text-sm font-semibold">
													{formatter.price(lineTotal(it))}
												</span>
												<button
													type="button"
													onClick={() => removeItem(idx)}
													className="text-gray-400 hover:text-red-600"
													title={t("ordersPage:edit.remove", "הסר")}
												>
													🗑
												</button>
											</div>
										</div>

										{/* substitution picker */}
										{it.status === "substituted" && (
											<div className="mt-2 rounded-md bg-[#f3f8f4] p-2">
												{it.substitutedWith && (
													<div className="flex items-center justify-between gap-2 flex-wrap text-sm">
														<span className="text-[#155f30]">
															✓ {it.substitutedWith.product.name?.[0]?.value}
														</span>
														<label className="flex items-center gap-1">
															{t("ordersPage:edit.subQty", "כמות")}:
															<Input
																type="number"
																min={1}
																value={String(it.substitutedWith.amount)}
																onChange={(e) => setSubQty(idx, Number(e.target.value))}
																className="w-16"
															/>
														</label>
														<button
															type="button"
															className="text-xs text-gray-500 underline"
															onClick={() => setSubFor(idx)}
														>
															{t("ordersPage:edit.changeSub", "שנה")}
														</button>
													</div>
												)}
												{subFor === idx && (
													<div className="mt-2">
														<Input
															placeholder={t("ordersPage:edit.searchSub", "חפש מוצר תחליף…")}
															value={subQuery}
													onChange={(e) => search(e.target.value, idx)}
															autoFocus
														/>
														{subResults.length > 0 && (
															<div className="mt-1 max-h-40 overflow-auto rounded-md border border-gray-100 bg-white">
																{subResults.map((p) => (
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

						<div className="flex items-center justify-between border-t pt-3 font-bold">
							<span>{t("ordersPage:edit.total", "סה״כ הזמנה")}</span>
							<span>{formatter.price(cost.finalCost)}</span>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="ghost" onPress={close}>
							{t("common:cancel", "ביטול")}
						</Button>
						<Button
							variant="primary"
							isPending={saving}
							isDisabled={items.length === 0}
							onPress={save}
						>
							{t("ordersPage:edit.save", "שמור שינויים")}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
