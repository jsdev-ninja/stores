import { Table, Chip, Spinner, Select, Input, ListBox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { modalApi } from "src/infra/modals";
import { useAdminCustomerInvoices, type InvoiceStatus } from "./useAdminCustomerInvoices";
import type { InvoiceRow } from "src/lib/firebase/api";

// ─── Helpers (verbatim from AdminBudgetPage / AdminDeliveryNotesPage) ─────────

function fmtDate(ms?: number): string {
  if (!ms) return "—";
  const v = ms < 1e12 ? ms * 1000 : ms;
  try {
    return new Date(v).toLocaleDateString("he-IL");
  } catch {
    return "—";
  }
}

function fmtMoney(n: number): string {
  return "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
      <span className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      <b
        className="block text-2xl font-extrabold leading-none tracking-tight"
        style={{ color: color ?? "var(--foreground)" }}
      >
        {value}
      </b>
    </div>
  );
}

// ─── Status pill (mirrors demo invoiceStatusPill, no overdue) ─────────────────

const STATUS_META: Record<InvoiceStatus, { label: string; color: "success" | "warning" | "default" }> = {
  paid: { label: "✓ שולם", color: "success" },
  partial: { label: "חלקי", color: "warning" },
  open: { label: "פתוח", color: "default" },
};

function InvoiceStatusPill({ status }: { status: InvoiceStatus }) {
  const meta = STATUS_META[status];
  return (
    <Chip size="sm" color={meta.color} variant="soft">
      <Chip.Label>{meta.label}</Chip.Label>
    </Chip>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS = [
  { uid: "number", label: "מס׳ חשבונית" },
  { uid: "company", label: "חברה" },
  { uid: "date", label: "תאריך" },
  { uid: "total", label: "סכום" },
  { uid: "paid", label: "שולם" },
  { uid: "balance", label: "יתרה" },
  { uid: "status", label: "סטטוס" },
  { uid: "actions", label: "" },
];

// ─── CSV export (verbatim pattern from AdminOrdersPage.exportOrders) ──────────

function exportToCSV(rows: InvoiceRow[]) {
  const header = ["מס׳ חשבונית", "חברה", "תאריך", "סכום", "שולם", "יתרה", "סטטוס"];
  const STATUS_LABELS: Record<InvoiceStatus, string> = { paid: "שולם", partial: "חלקי", open: "פתוח" };
  const csvRows = rows.map((r) => [
    r.invoiceNumber,
    r.displayName,
    fmtDate(r.issueDate),
    String(r.total),
    String(r.paid),
    String(r.balance),
    STATUS_LABELS[r.status],
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  // eslint-disable-next-line compat/compat
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customer-invoices.csv";
  a.click();
  // eslint-disable-next-line compat/compat
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCustomerInvoicesPage() {
  const {
    loading,
    filtered,
    organizations,
    kpis,
    unbilledCount,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    companyFilter,
    setCompanyFilter,
    reload,
  } = useAdminCustomerInvoices();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">חשבוניות לקוחות</h1>

      {/* Bulk-billing banner — shown when delivery notes await an invoice */}
      {unbilledCount > 0 && (
        <div
          className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-4 py-3"
          dir="rtl"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <Icon icon="lucide:truck" width={18} height={18} className="text-[var(--accent)]" />
            יש {unbilledCount} תעודות משלוח שעדיין לא חויבו
          </div>
          <button
            type="button"
            onClick={() => modalApi.openModal("bulkBilling", { onDone: () => reload() })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Icon icon="lucide:layers" width={15} height={15} />
            הפק חשבוניות מרוכזות
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label='סה"כ חשבוניות' value={fmtMoney(kpis.totalInvoiced)} />
        <KpiCard label="מס׳ חשבוניות" value={kpis.count} />
        <KpiCard label='סה"כ שולם' value={fmtMoney(kpis.totalPaid)} color="var(--success)" />
        <KpiCard label="יתרה לגבייה" value={fmtMoney(kpis.totalOutstanding)} color="var(--danger)" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Icon
              icon="lucide:search"
              className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              width={16}
              height={16}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש חשבונית / לקוח..."
              type="search"
              aria-label="חיפוש חשבונית"
              className="ps-7 w-64"
            />
          </div>

          {/* Status filter */}
          <div className="w-40">
            <Select
              selectedKey={statusFilter}
              onSelectionChange={(k) => setStatusFilter(k as string)}
              aria-label="סינון לפי סטטוס"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="הכל">הכל</ListBox.Item>
                  <ListBox.Item id="paid" textValue="שולם">שולם</ListBox.Item>
                  <ListBox.Item id="open" textValue="פתוח">פתוח</ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Company filter */}
          <div className="w-48">
            <Select
              selectedKey={companyFilter}
              onSelectionChange={(k) => setCompanyFilter(k as string)}
              aria-label="סינון לפי חברה"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="כל החברות">כל החברות</ListBox.Item>
                  {organizations.map((org) => (
                    <ListBox.Item key={org.id} id={org.id} textValue={org.name}>
                      {org.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={() => exportToCSV(filtered)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Icon icon="lucide:download" width={14} height={14} />
          ייצוא לאקסל
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <Icon icon="lucide:receipt" className="mx-auto mb-3 text-4xl" />
          <p>אין חשבוניות להצגה</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Customer invoices"
                className="min-w-[900px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
              >
                <Table.Header>
                  {COLUMNS.map((col) => (
                    <Table.Column
                      key={col.uid}
                      isRowHeader={col.uid === "number"}
                      className="text-[11px] font-bold uppercase tracking-wide text-[var(--foreground)] py-3"
                      style={{ backgroundColor: "var(--default)", borderRadius: 0 }}
                    >
                      {col.label}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {filtered.map((row) => (
                    <Table.Row key={row.orderId}>
                      {/* מס׳ חשבונית */}
                      <Table.Cell className="py-3">
                        <span className="font-semibold text-sm text-[var(--foreground)]">
                          {row.invoiceNumber}
                        </span>
                      </Table.Cell>

                      {/* חברה */}
                      <Table.Cell className="py-3">
                        <span className="text-sm text-[var(--foreground)]">{row.displayName}</span>
                      </Table.Cell>

                      {/* תאריך */}
                      <Table.Cell className="py-3">
                        <span className="text-sm text-[var(--muted)]">{fmtDate(row.issueDate)}</span>
                      </Table.Cell>

                      {/* סכום */}
                      <Table.Cell className="py-3">
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {fmtMoney(row.total)}
                        </span>
                      </Table.Cell>

                      {/* שולם */}
                      <Table.Cell className="py-3">
                        <span className="text-sm text-[var(--foreground)]">
                          {fmtMoney(row.paid)}
                        </span>
                      </Table.Cell>

                      {/* יתרה */}
                      <Table.Cell className="py-3">
                        <span
                          className="text-sm font-bold"
                          style={{ color: row.balance > 0 ? "var(--danger)" : "var(--foreground)" }}
                        >
                          {fmtMoney(row.balance)}
                        </span>
                      </Table.Cell>

                      {/* סטטוס */}
                      <Table.Cell className="py-3">
                        <InvoiceStatusPill status={row.status} />
                      </Table.Cell>

                      {/* פעולות */}
                      <Table.Cell className="py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* צפה — open the EZcount PDF */}
                          <a
                            href={row.invoicePdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                          >
                            <Icon icon="lucide:eye" width={13} height={13} />
                            צפה
                          </a>

                          {/* רישום תשלום — only when balance > 0 */}
                          {row.balance > 0 && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                              onClick={() =>
                                modalApi.openModal("recordInvoicePayment", {
                                  row,
                                  onPaymentRecorded: () => reload(),
                                })
                              }
                            >
                              <Icon icon="lucide:circle-dollar-sign" width={13} height={13} />
                              רישום תשלום
                            </button>
                          )}

                          {/* TODO: allocation editing — wire setInvoiceAllocation once backend lands
                              see docs/plans/invoices-list-and-bulk-billing.md §3.4 */}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
      )}
    </div>
  );
}
