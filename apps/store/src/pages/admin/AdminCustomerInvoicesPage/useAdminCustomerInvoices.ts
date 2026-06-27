import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppApi } from "src/appApi";
import type { TOrder, TOrganization } from "@jsdev_ninja/core";

// ─── Unbilled banner ──────────────────────────────────────────────────────────

export type UnbilledSummary = {
  dnCount: number;
  companyCount: number;
  totalAmount: number;
};

function getUnbilledSummary(orders: TOrder[]): UnbilledSummary {
  const unbilled = orders.filter(
    (o) => o.ezDeliveryNote?.success && !o.invoice && !o.ezInvoice?.success,
  );
  const companies = new Set(unbilled.map((o) => (o.organizationId as string | undefined) ?? null));
  const totalAmount = unbilled.reduce((s, o) => s + (o.cart?.cartTotal ?? 0), 0);
  return { dnCount: unbilled.length, companyCount: companies.size, totalAmount };
}

export type InvoiceStatus = "paid" | "open";

export type InvoiceRow = {
  orderId: string;
  invoiceUuid: string;
  invoiceNumber: string;
  invoicePdfLink: string;
  issueDate: number; // epoch millis
  total: number; // shekels (ILS)
  displayName: string;
  organizationId?: string;
  paid: number;
  balance: number;
  status: InvoiceStatus;
};

// ─── Month helpers (verbatim from AdminDeliveryNotesPage) ─────────────────────

function getMonthRange(date: Date): { fromDate: number; toDate: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    fromDate: new Date(year, month, 1).getTime(),
    toDate: new Date(year, month + 1, 0, 23, 59, 59, 999).getTime(),
  };
}

// ─── EZcount shape (runtime shape written by createInvoice backend) ───────────
// order.invoice in Firestore holds the EZcount response (doc_number, pdf_link,
// calculatedData, success) even though InvoiceSchema types it differently.
// We access it via unknown cast to avoid type widening the rest of TOrder.

type EzShape = {
  success?: boolean;
  doc_uuid?: string;
  doc_number?: string;
  pdf_link?: string;
  calculatedData?: { price_total?: string; date?: string };
};

function getInvoiceEzShape(order: TOrder): EzShape | undefined {
  // Prefer order.ezInvoice (correctly typed). Fall back to order.invoice cast
  // for orders where createInvoice wrote the EZcount payload to the invoice field.
  if (order.ezInvoice?.success) {
    return order.ezInvoice as EzShape;
  }
  if (order.invoice) {
    return order.invoice as unknown as EzShape;
  }
  return undefined;
}

// ─── Order → InvoiceRow mapper ────────────────────────────────────────────────

function mapOrderToRow(order: TOrder, orgNameById: Map<string, string>): InvoiceRow | null {
  const inv = getInvoiceEzShape(order);
  if (!inv?.success || !inv.doc_uuid || !inv.doc_number || !inv.pdf_link) return null;

  // total: prefer EZcount calculatedData, fall back to cartTotal
  const total =
    parseFloat(inv.calculatedData?.price_total ?? "") ||
    (order.cart?.cartTotal ?? 0);

  // issueDate: parse YYYY-MM-DD from calculatedData, fall back to order.date
  let issueDate = order.date;
  const rawDate = inv.calculatedData?.date;
  if (rawDate) {
    const parsed = Date.parse(rawDate);
    if (!isNaN(parsed)) issueDate = parsed;
  }

  // displayName: org name → nameOnInvoice → companyName → displayName → fallback
  const displayName =
    (order.organizationId ? orgNameById.get(order.organizationId) : undefined) ??
    order.nameOnInvoice ??
    order.client?.companyName ??
    order.client?.displayName ??
    "—";

  const paid = order.invoicePaidAt ? total : 0;
  const balance = total - paid;
  const status: InvoiceStatus = order.invoicePaidAt ? "paid" : "open";

  return {
    orderId: order.id,
    invoiceUuid: inv.doc_uuid,
    invoiceNumber: inv.doc_number,
    invoicePdfLink: inv.pdf_link,
    issueDate,
    total,
    displayName,
    organizationId: order.organizationId,
    paid,
    balance,
    status,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminCustomerInvoices() {
  const appApi = useAppApi();

  const [orders, setOrders] = useState<TOrder[]>([]);
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Unbilled DN summary for the banner — loaded once on mount using current month
  const [unbilledSummary, setUnbilledSummary] = useState<UnbilledSummary>({
    dnCount: 0,
    companyCount: 0,
    totalAmount: 0,
  });

  const loadUnbilled = useCallback(async () => {
    try {
      const { fromDate, toDate } = getMonthRange(new Date());
      const result = await appApi.admin.getDeliveryNotes({ fromDate, toDate });
      if (result?.success) {
        setUnbilledSummary(getUnbilledSummary((result.data ?? []) as TOrder[]));
      }
    } catch {
      // silent — banner just won't show
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { fromDate, toDate } = getMonthRange(selectedMonth);
      const result = await appApi.admin.getInvoices({ fromDate, toDate });
      if (result?.success) setOrders(result.data || []);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadUnbilled();
  }, [loadUnbilled]);

  useEffect(() => {
    appApi.admin.listOrganizations().then((result) => {
      if (result?.success) setOrganizations((result.data || []) as TOrganization[]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appApi stable
  }, []);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [organizations]);

  const rows = useMemo<InvoiceRow[]>(() => {
    const mapped: InvoiceRow[] = [];
    for (const order of orders) {
      const row = mapOrderToRow(order, orgNameById);
      if (row) mapped.push(row);
    }
    return mapped;
  }, [orders, orgNameById]);

  const kpis = useMemo(() => {
    const totalInvoiced = rows.reduce((sum, r) => sum + r.total, 0);
    const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
    const totalOutstanding = rows.reduce((sum, r) => sum + r.balance, 0);
    return { totalInvoiced, totalPaid, totalOutstanding, count: rows.length };
  }, [rows]);

  const filtered = useMemo<InvoiceRow[]>(() => {
    let list = rows;

    if (companyFilter !== "all") {
      list = list.filter((r) => r.organizationId === companyFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.invoiceNumber.toLowerCase().includes(q) ||
          r.displayName.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => b.issueDate - a.issueDate);
  }, [rows, companyFilter, statusFilter, search]);

  const shiftMonth = (delta: number) =>
    setSelectedMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return {
    loading,
    filtered,
    organizations,
    kpis,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    companyFilter,
    setCompanyFilter,
    selectedMonth,
    shiftMonth,
    reload: loadInvoices,
    unbilledSummary,
    reloadUnbilled: loadUnbilled,
  };
}
