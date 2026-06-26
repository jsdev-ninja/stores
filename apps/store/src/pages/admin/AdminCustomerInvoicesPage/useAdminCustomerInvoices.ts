import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppApi } from "src/appApi";
import type { TOrganization } from "@jsdev_ninja/core";
import type { InvoiceRow, InvoiceStatus } from "src/lib/firebase/api";

export type { InvoiceStatus } from "src/lib/firebase/api";

export function useAdminCustomerInvoices() {
  const appApi = useAppApi();

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // All invoices (paid + open) with paid/balance/status derived server-side.
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await appApi.admin.getInvoices();
      if (result?.success) setRows(result.data ?? []);
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
      list = list.filter((r) => r.status === (statusFilter as InvoiceStatus));
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
