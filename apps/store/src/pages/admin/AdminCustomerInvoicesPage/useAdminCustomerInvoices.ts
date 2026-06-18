import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppApi } from "src/appApi";
import type { TOrganization } from "@jsdev_ninja/core";
import type { OpenInvoiceRow } from "src/lib/firebase/api";

export type InvoiceStatus = "paid" | "partial" | "open";

type DerivedRow = OpenInvoiceRow & {
  paid: number;
  balance: number;
  status: InvoiceStatus;
};

function deriveRow(row: OpenInvoiceRow): DerivedRow {
  const paid = 0;
  const balance = row.total - paid;
  const status: InvoiceStatus =
    balance <= 0.01 ? "paid" : paid > 0 ? "partial" : "open";
  return { ...row, paid, balance, status };
}

export function useAdminCustomerInvoices() {
  const appApi = useAppApi();

  const [rawRows, setRawRows] = useState<OpenInvoiceRow[]>([]);
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // TEMPORARY: sourced from getOpenInvoices (unpaid only) for the UI-first preview.
  // Replace with appApi.admin.getInvoices() (all invoices incl. paid) once the
  // backend endpoint lands — see docs/plans/invoices-list-and-bulk-billing.md.
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await appApi.admin.getOpenInvoices();
      if (result?.success) setRawRows(result.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    appApi.admin.listOrganizations().then((result) => {
      if (result?.success) setOrganizations((result.data || []) as TOrganization[]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appApi stable
  }, []);

  const rows = useMemo<DerivedRow[]>(() => rawRows.map(deriveRow), [rawRows]);

  const kpis = useMemo(() => {
    const totalInvoiced = rows.reduce((sum, r) => sum + r.total, 0);
    const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
    const totalOutstanding = rows.reduce((sum, r) => sum + r.balance, 0);
    return { totalInvoiced, totalPaid, totalOutstanding, count: rows.length };
  }, [rows]);

  const filtered = useMemo<DerivedRow[]>(() => {
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
    reload: loadInvoices,
  };
}
