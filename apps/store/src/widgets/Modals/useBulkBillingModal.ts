import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppApi } from "src/appApi";
import { useApiState } from "src/appApi/useApiState";
import { FirebaseApi } from "src/lib/firebase";
import { FirebaseAPI, type TOrder, type TOrganization } from "@jsdev_ninja/core";
import { VAT_TYPE } from "src/lib/firebase/api";
import { toast } from "@heroui/react";
import { modalApi } from "src/infra/modals";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DnItem = {
  orderId: string;
  dnId: string; // ezDeliveryNote.doc_uuid — stable unique key
  docNumber: string; // ezDeliveryNote.doc_number
  date: number; // order.date epoch millis
  itemCount: number; // cart.items.length
  total: number; // cart.cartTotal (shekels)
  order: TOrder; // full order ref for createInvoice payload
};

export type CompanyGroup = {
  organizationId: string | null; // null = B2C / no org
  companyName: string;
  items: DnItem[];
  selectedTotal: number; // recomputed by selector
  isAboveThreshold: boolean; // selectedTotal >= 5000
  isZeroSum: boolean; // selectedTotal <= 0
};

export type CompanyResult = {
  organizationId: string | null;
  companyName: string;
  status: "ok" | "skipped" | "error";
  invoiceNumber?: string;
  message?: string;
};

type ExecutionPhase = "idle" | "running" | "done";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthRange(date: Date): { fromDate: number; toDate: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    fromDate: new Date(year, month, 1).getTime(),
    toDate: new Date(year, month + 1, 0, 23, 59, 59, 999).getTime(),
  };
}

/** True when an order has a successful DN but no invoice yet. */
function isUnbilled(order: TOrder): boolean {
  if (!order.ezDeliveryNote?.success) return false;
  // Exclude orders that already have an invoice
  if (order.invoice) return false;
  if (order.ezInvoice?.success) return false;
  return true;
}

function todayIsrael(): string {
  return Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDateDDMMYYYY(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBulkBillingModal(onDone?: () => void) {
  const appApi = useAppApi();
  const { store } = useApiState();

  const [orders, setOrders] = useState<TOrder[]>([]);
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  // Set of selected order IDs (using orderId as the stable key)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<ExecutionPhase>("idle");
  const [results, setResults] = useState<CompanyResult[]>([]);

  // Load unbilled DNs for current month + organizations
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { fromDate, toDate } = getMonthRange(new Date());
      const [dnRes, orgRes] = await Promise.all([
        appApi.admin.getDeliveryNotes({ fromDate, toDate }),
        appApi.admin.listOrganizations(),
      ]);
      const allOrders = (dnRes?.data ?? []) as TOrder[];
      setOrders(allOrders.filter(isUnbilled));
      if (orgRes?.success) setOrganizations((orgRes.data ?? []) as TOrganization[]);
    } catch {
      // silent — banner / empty state handles it
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

  useEffect(() => {
    load();
  }, [load]);

  // Org name lookup
  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  // Build DnItem per order
  const dnItems = useMemo<DnItem[]>(() => {
    return orders.map((o) => ({
      orderId: o.id,
      dnId: o.ezDeliveryNote!.doc_uuid!,
      docNumber: o.ezDeliveryNote!.doc_number ?? "",
      date: o.date,
      itemCount: o.cart?.items?.length ?? 0,
      total: o.cart?.cartTotal ?? 0,
      order: o,
    }));
  }, [orders]);

  // Group by organizationId
  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string | null, DnItem[]>();
    for (const item of dnItems) {
      const key = (item.order.organizationId as string | undefined) ?? null;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    const result: CompanyGroup[] = [];
    for (const [orgId, items] of map.entries()) {
      const companyName =
        orgId != null
          ? (orgNameById.get(orgId) ?? orgId)
          : "ללא חברה (B2C)";
      const selectedTotal = items
        .filter((i) => selectedIds.has(i.orderId))
        .reduce((s, i) => s + i.total, 0);
      result.push({
        organizationId: orgId,
        companyName,
        items,
        selectedTotal,
        isAboveThreshold: selectedTotal >= 5000,
        isZeroSum: selectedTotal <= 0,
      });
    }
    // B2B first (orgId != null), B2C last
    return result.sort((a, b) => {
      if (a.organizationId === null) return 1;
      if (b.organizationId === null) return -1;
      return a.companyName.localeCompare(b.companyName, "he");
    });
  }, [dnItems, selectedIds, orgNameById]);

  // Seed initial selection: all B2B items selected, B2C unchecked
  useEffect(() => {
    if (dnItems.length === 0) return;
    const initial = new Set<string>();
    for (const item of dnItems) {
      const hasOrg = !!(item.order.organizationId as string | undefined);
      if (hasOrg) initial.add(item.orderId);
    }
    setSelectedIds(initial);
  }, [dnItems]);

  // Summary
  const summary = useMemo(() => {
    const selectedItems = dnItems.filter((i) => selectedIds.has(i.orderId));
    const eligibleCompanies = new Set(
      selectedItems
        .filter((i) => {
          const g = groups.find(
            (g) => g.organizationId === ((i.order.organizationId as string | undefined) ?? null),
          );
          return g && !g.isAboveThreshold && !g.isZeroSum;
        })
        .map((i) => (i.order.organizationId as string | undefined) ?? null),
    );
    const totalAmount = selectedItems
      .filter((i) => {
        const g = groups.find(
          (g) => g.organizationId === ((i.order.organizationId as string | undefined) ?? null),
        );
        return g && !g.isAboveThreshold && !g.isZeroSum;
      })
      .reduce((s, i) => s + i.total, 0);
    return {
      invoiceCount: eligibleCompanies.size,
      dnCount: selectedItems.length,
      totalAmount,
    };
  }, [dnItems, selectedIds, groups]);

  // ─── Toggle handlers ──────────────────────────────────────────────────────

  const toggleOne = useCallback((orderId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  }, []);

  const toggleGroup = useCallback(
    (organizationId: string | null, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const groupItems = dnItems.filter(
          (i) => ((i.order.organizationId as string | undefined) ?? null) === organizationId,
        );
        for (const item of groupItems) {
          if (checked) next.add(item.orderId);
          else next.delete(item.orderId);
        }
        return next;
      });
    },
    [dnItems],
  );

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(dnItems.map((i) => i.orderId)) : new Set());
    },
    [dnItems],
  );

  /** checked/indeterminate state for a group's master checkbox */
  const groupCheckState = useCallback(
    (organizationId: string | null): "all" | "some" | "none" => {
      const group = groups.find((g) => g.organizationId === organizationId);
      if (!group) return "none";
      const total = group.items.length;
      const checked = group.items.filter((i) => selectedIds.has(i.orderId)).length;
      if (checked === 0) return "none";
      if (checked === total) return "all";
      return "some";
    },
    [groups, selectedIds],
  );

  // ─── Execute ──────────────────────────────────────────────────────────────

  const execute = useCallback(async () => {
    if (!store) return;
    setPhase("running");
    const collected: CompanyResult[] = [];

    for (const group of groups) {
      // Eligible: has selected items, not above threshold, not zero sum
      const selectedInGroup = group.items.filter((i) => selectedIds.has(i.orderId));

      if (selectedInGroup.length === 0) continue;

      if (group.isAboveThreshold) {
        collected.push({
          organizationId: group.organizationId,
          companyName: group.companyName,
          status: "skipped",
          message: "נדרש מספר הקצאה — הפק ידנית",
        });
        continue;
      }

      if (group.isZeroSum) {
        collected.push({
          organizationId: group.organizationId,
          companyName: group.companyName,
          status: "skipped",
          message: "סכום אפס — לא ניתן להפיק",
        });
        continue;
      }

      // Re-check: drop any orders that got invoiced since load
      const freshOrders = selectedInGroup
        .map((i) => i.order)
        .filter((o) => !o.invoice && !o.ezInvoice?.success);

      if (freshOrders.length === 0) {
        collected.push({
          organizationId: group.organizationId,
          companyName: group.companyName,
          status: "skipped",
          message: "כל התעודות כבר חויבו",
        });
        continue;
      }

      const priceTotal = freshOrders.reduce((s, o) => s + (o.cart?.cartTotal ?? 0), 0);
      const firstOrder = freshOrders[0];

      try {
        const invoiceDate = todayIsrael();
        const res = await FirebaseApi.api.createInvoice(store.id, {
          orders: freshOrders,
          params: {
            item: freshOrders.map((o) => ({
              details: `תעודת משלוח ${o.ezDeliveryNote?.doc_number ?? ""}`,
              price: o.cart?.cartTotal ?? 0,
              amount: 1,
              vat_type: VAT_TYPE.NON,
            })),
            transaction_id: crypto.randomUUID(),
            customer_name:
              group.organizationId != null
                ? (orgNameById.get(group.organizationId) ?? group.companyName)
                : (firstOrder.nameOnInvoice ?? firstOrder.client?.displayName ?? ""),
            customer_email: firstOrder.client?.email ?? "",
            customer_phone: firstOrder.client?.phoneNumber ?? "",
            description: "חשבונית מרוכזת",
            price_total: priceTotal,
            parent: freshOrders
              .map((o) => o.ezDeliveryNote?.doc_uuid)
              .filter(Boolean)
              .join(","),
            date: formatDateDDMMYYYY(invoiceDate),
          },
        });

        if (!res.success || !res.data) {
          collected.push({
            organizationId: group.organizationId,
            companyName: group.companyName,
            status: "error",
            message: (res as unknown as { error?: string }).error ?? "שגיאה לא ידועה",
          });
          continue;
        }

        // Persist invoice data on each order (mirrors InvoiceDetailsModal)
        const invoiceData = res.data;
        await Promise.all(
          freshOrders.map((order) =>
            FirebaseApi.firestore.setV2<{ id: string; doc: TOrder }>({
              collection: FirebaseAPI.firestore.getPath({
                companyId: store.companyId,
                storeId: store.id,
                collectionName: "orders",
              }),
              doc: {
                id: order.id,
                invoice: {
                  ...(invoiceData as object),
                  date: new Date(invoiceDate).getTime(),
                },
              } as unknown as { id: string; doc: TOrder },
            }),
          ),
        );

        const ezData = invoiceData as { doc_number?: string };
        collected.push({
          organizationId: group.organizationId,
          companyName: group.companyName,
          status: "ok",
          invoiceNumber: ezData.doc_number,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        collected.push({
          organizationId: group.organizationId,
          companyName: group.companyName,
          status: "error",
          message: msg,
        });
      }
    }

    setResults(collected);
    setPhase("done");

    const okCount = collected.filter((r) => r.status === "ok").length;
    if (okCount > 0) {
      toast.success(`הופקו ${okCount} חשבוניות בהצלחה`);
    }
    onDone?.();
  }, [store, groups, selectedIds, orgNameById, onDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    modalApi.closeModal("bulkBilling");
  }, []);

  return {
    loading,
    groups,
    selectedIds,
    summary,
    phase,
    results,
    toggleOne,
    toggleGroup,
    toggleAll,
    groupCheckState,
    execute,
    close,
  };
}
