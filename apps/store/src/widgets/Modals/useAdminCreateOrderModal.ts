import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { productsIndex } from "src/services";
import { useAppApi } from "src/appApi";
import { useStore } from "src/domains/Store";
import { useAppSelector } from "src/infra";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { TOrganization, TProduct, TOrder, TBillingAccount } from "@jsdev_ninja/core";
import type { Key } from "react-aria-components";

export type OrderLine = { product: TProduct; qty: number };

export function useAdminCreateOrderModal(onOrderCreated?: (order: TOrder) => void) {
	const appApi = useAppApi();
	const store = useStore();
	const user = useAppSelector((s) => s.user.user);

	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [searchResults, setSearchResults] = useState<TProduct[]>([]);
	const [selectedOrgId, setSelectedOrgId] = useState<string>("");
	const [selectedAccountId, setSelectedAccountId] = useState<string>("");
	const [lines, setLines] = useState<OrderLine[]>([]);
	const [productSearchQuery, setProductSearchQuery] = useState("");
	// The product the user has highlighted/selected from the search dropdown.
	const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);
	const [qty, setQty] = useState(1);
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const [deliveryDate, setDeliveryDate] = useState(tomorrow.toISOString().split("T")[0]);

	useEffect(() => {
		appApi.admin.listOrganizations().then((res) => {
			if (res?.success) setOrganizations(res.data ?? []);
		});
	}, []);

	// Debounced Algolia search — tenant-scoped (HARD RULE: always filter by storeId+companyId).
	const searchProducts = useCallback(
		(query: string) => {
			setProductSearchQuery(query);
			setSelectedProduct(null);
			if (searchTimer.current) clearTimeout(searchTimer.current);
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}
			searchTimer.current = setTimeout(async () => {
				if (!store) return;
				const { hits } = await productsIndex.search<TProduct>(query, {
					// Tenant isolation: NEVER search without storeId+companyId filter.
					filters: `storeId:${store.id} AND companyId:${store.companyId}`,
					hitsPerPage: 20,
				});
				setSearchResults(hits as TProduct[]);
			}, 250);
		},
		[store],
	);

	const selectedOrg = useMemo(
		() => organizations.find((o) => o.id === selectedOrgId) ?? null,
		[organizations, selectedOrgId],
	);

	const showBillingAccountSelector = (selectedOrg?.billingAccounts?.length ?? 0) > 1;

	const cartTotal = useMemo(
		() => lines.reduce((sum, l) => sum + l.product.price * l.qty, 0),
		[lines],
	);

	const handleOrgChange = useCallback((key: Key | null) => {
		setSelectedOrgId(key ? String(key) : "");
		setSelectedAccountId("");
	}, []);

	const handleAccountChange = useCallback((key: Key | null) => {
		setSelectedAccountId(key ? String(key) : "");
	}, []);

	const selectProduct = useCallback((product: TProduct) => {
		setSelectedProduct(product);
		setProductSearchQuery(product.name?.[0]?.value ?? "");
		setSearchResults([]);
	}, []);

	const addLine = useCallback(() => {
		if (!selectedProduct || qty < 1) return;
		setLines((prev) => {
			const existing = prev.findIndex((l) => l.product.id === selectedProduct.id);
			if (existing >= 0) {
				const next = [...prev];
				next[existing] = { ...next[existing], qty: next[existing].qty + qty };
				return next;
			}
			return [...prev, { product: selectedProduct, qty }];
		});
		setSelectedProduct(null);
		setProductSearchQuery("");
		setSearchResults([]);
		setQty(1);
	}, [selectedProduct, qty]);

	const removeLine = useCallback((idx: number) => {
		setLines((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleSubmit = useCallback(async () => {
		if (!lines.length || !selectedOrgId || !store || !user) return;
		if (showBillingAccountSelector && !selectedAccountId) {
			setError("יש לבחור כרטיס חשבון");
			return;
		}

		const billingAccount: TBillingAccount | undefined = showBillingAccountSelector
			? selectedOrg?.billingAccounts.find((a) => a.id === selectedAccountId)
			: selectedOrg?.billingAccounts?.[0];

		const orderId = FirebaseApi.firestore.generateDocId("orders");
		const cartTotal_ = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

		const order: TOrder = {
			type: "Order",
			id: orderId,
			companyId: store.companyId,
			storeId: store.id,
			userId: user.uid,
			createdBy: "admin",
			status: "pending",
			paymentStatus: store.paymentType === "external" ? "external" : "pending",
			date: Date.now(),
			deliveryDate: new Date(deliveryDate).getTime(),
			organizationId: selectedOrgId || undefined,
			billingAccount: billingAccount ?? undefined,
			clientComment: notes || undefined,
			storeOptions: {
				deliveryPrice: store.deliveryPrice,
				freeDeliveryPrice: store.freeDeliveryPrice,
				isVatIncludedInPrice: store.isVatIncludedInPrice,
				freeShipping: selectedOrg?.freeShipping ?? false,
			},
			cart: {
				id: orderId,
				items: lines.map((l) => ({
					product: l.product,
					amount: l.qty,
					originalPrice: l.product.price,
					finalPrice: l.product.price,
					finalDiscount: 0,
				})),
				cartTotal: cartTotal_,
				cartDiscount: 0,
				cartVat: 0,
				deliveryPrice: 0,
			},
		} as unknown as TOrder;

		setSubmitting(true);
		setError(null);
		try {
			const res = await appApi.orders.order({ order });
			if (res?.success) {
				onOrderCreated?.(order);
				modalApi.closeModal("adminCreateOrder");
			} else {
				setError("שגיאה ביצירת ההזמנה");
			}
		} finally {
			setSubmitting(false);
		}
	}, [
		lines, selectedOrgId, store, user, showBillingAccountSelector,
		selectedAccountId, selectedOrg, deliveryDate, notes, appApi, onOrderCreated,
	]);

	const close = useCallback(() => modalApi.closeModal("adminCreateOrder"), []);

	return {
		organizations, searchResults, selectedOrgId, selectedOrg,
		showBillingAccountSelector, selectedAccountId, lines, cartTotal,
		productSearchQuery, searchProducts, selectedProduct, selectProduct,
		qty, setQty, notes, setNotes, deliveryDate, setDeliveryDate,
		submitting, error, handleOrgChange, handleAccountChange,
		addLine, removeLine, handleSubmit, close,
	};
}
