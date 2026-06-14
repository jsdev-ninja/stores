import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Chip,
  Spinner,
  Select,
  TextArea,
  Modal,
  ListBox,
  Input,
} from "@heroui/react";
import { Button } from "src/components/button";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { navigate, useParams } from "src/navigation";
import { FirebaseApi } from "src/lib/firebase";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import type { Key } from "react-aria-components";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import type { TOrder, TOrganization } from "@jsdev_ninja/core";

type TBudgetAccount = {
  id: string;
  organizationId: string;
  organizationName: string;
  companyId: string;
  storeId: string;
  totalDebits: number;
  totalCredits: number;
  balance: number;
  currency: "ILS";
  updatedAt: number;
};

type TBudgetTransactionType =
  | "delivery_note"
  | "payment_received"
  | "credit_note"
  | "debit_note"
  | "order_created"
  | "order_cancelled"
  | "order_refunded";

type TPaymentMethod = "check" | "bank_transfer" | "cash" | "credit_card" | "other";

type TBudgetTransaction = {
  id: string;
  type: TBudgetTransactionType;
  debt: number;
  runningBalance: number;
  orderId: string | null;
  orderTotal: number | null;
  deliveryNoteId: string | null;
  deliveryNoteNumber: string | null;
  billingAccountId: string | null;
  billingAccountName: string | null;
  billingAccountNumber: string | null;
  paymentReference: string | null;
  paymentDate: number | null;
  paymentMethod: TPaymentMethod | null;
  note: string | null;
  createdAt: number;
  createdBy: string;
};

// ─── Helpers (copied from AdminDeliveryNotesPage) ────────────────────────────

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

function dnNumber(o: TOrder): string {
  return o.deliveryNote?.number ?? o.ezDeliveryNote?.doc_number ?? "—";
}
function dnPdf(o: TOrder): string | undefined {
  return o.deliveryNote?.link ?? o.ezDeliveryNote?.pdf_link ?? o.ezDeliveryNote?.pdf_link_copy;
}
function dnDate(o: TOrder): number {
  return o.deliveryNote?.date ?? o.date;
}
function dnItemCount(o: TOrder): number {
  return o.deliveryNote?.items?.length ?? o.cart?.items?.length ?? 0;
}
function dnTotal(o: TOrder): number {
  return o.deliveryNote?.total ?? o.cart?.cartTotal ?? 0;
}
type DnStatus = "pending" | "paid" | "cancelled";
function dnStatus(o: TOrder): DnStatus | undefined {
  return o.deliveryNote?.status;
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

const isUnpaid = (o: TOrder) => {
  const s = dnStatus(o);
  return s !== "paid" && s !== "cancelled" && !o.invoice && !o.ezInvoice && dnNumber(o) !== "—";
};

const DEBT_COLUMNS = [
  { uid: "company", label: "חברה" },
  { uid: "number", label: "מס׳ תעודה" },
  { uid: "date", label: "תאריך הנפקה" },
  { uid: "items", label: "פריטים" },
  { uid: "total", label: "סכום פתוח" },
  { uid: "actions", label: "" },
];

// ─── List page ───────────────────────────────────────────────────────────────

export function AdminBudgetPage() {
  const appApi = useAppApi();

  const [orders, setOrders] = useState<TOrder[]>([]);
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");

  const loadUnpaidDeliveryNotes = useCallback(async () => {
    setLoading(true);
    try {
      const toDate = Date.now();
      const fromDate = toDate - 365 * 24 * 60 * 60 * 1000;
      const result = await appApi.admin.getDeliveryNotes({ fromDate, toDate });
      if (result?.success) setOrders(result.data || []);
    } catch (error) {
      console.error("Failed to load delivery notes:", error);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

  useEffect(() => {
    loadUnpaidDeliveryNotes();
  }, [loadUnpaidDeliveryNotes]);

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

  const companyName = (o: TOrder) =>
    (o.organizationId && orgNameById.get(o.organizationId)) ||
    o.deliveryNote?.companyDetails?.name ||
    "—";

  const unpaid = useMemo(() => orders.filter(isUnpaid), [orders]);

  const kpis = useMemo(() => {
    const totalDebt = unpaid.reduce((sum, o) => sum + dnTotal(o), 0);
    return { totalDebt, count: unpaid.length };
  }, [unpaid]);

  const filtered = useMemo(() => {
    let list = unpaid;
    if (companyFilter !== "all") list = list.filter((o) => o.organizationId === companyFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          dnNumber(o).toLowerCase().includes(q) || companyName(o).toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => dnDate(b) - dnDate(a));
  }, [unpaid, companyFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">חובות לקוחות</h1>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label='סה"כ חוב פתוח' value={fmtMoney(kpis.totalDebt)} color="var(--danger)" />
        <KpiCard label="מס׳ תעודות פתוחות" value={kpis.count} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
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
            placeholder="חיפוש מספר תעודה / חברה..."
            type="search"
            aria-label="חיפוש חוב"
            className="ps-7 w-64"
          />
        </div>

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
                <ListBox.Item id="all" textValue="כל החברות">
                  כל החברות
                </ListBox.Item>
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <Icon icon="lucide:wallet" className="mx-auto mb-3 text-4xl" />
          <p>אין חובות פתוחים 🎉</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Unpaid delivery notes"
                className="min-w-[860px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
              >
                <Table.Header>
                  {DEBT_COLUMNS.map((col) => (
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
                  {filtered.map((o) => {
                    const pdf = dnPdf(o);
                    return (
                      <Table.Row key={o.id}>
                        {/* חברה */}
                        <Table.Cell className="py-3">
                          <span className="text-sm text-[var(--foreground)]">{companyName(o)}</span>
                        </Table.Cell>

                        {/* מס׳ תעודה */}
                        <Table.Cell className="py-3">
                          <span className="font-semibold text-sm text-[var(--foreground)]">
                            {dnNumber(o)}
                          </span>
                        </Table.Cell>

                        {/* תאריך הנפקה */}
                        <Table.Cell className="py-3">
                          <span className="text-sm text-[var(--muted)]">{fmtDate(dnDate(o))}</span>
                        </Table.Cell>

                        {/* פריטים */}
                        <Table.Cell className="py-3">
                          <span className="text-sm text-[var(--muted)]">{dnItemCount(o)} פריטים</span>
                        </Table.Cell>

                        {/* סכום פתוח */}
                        <Table.Cell className="py-3">
                          <span className="text-sm font-bold" style={{ color: "var(--danger)" }}>
                            {fmtMoney(dnTotal(o))}
                          </span>
                        </Table.Cell>

                        {/* פעולות */}
                        <Table.Cell className="py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            {pdf ? (
                              <a
                                href={pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                              >
                                <Icon icon="lucide:eye" width={13} height={13} />
                                צפה
                              </a>
                            ) : (
                              <span className="text-sm text-[var(--muted)]">—</span>
                            )}
                            {dnNumber(o) !== "—" && !o.invoice && !o.ezInvoice && !!o.ezDeliveryNote?.doc_uuid && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                                onClick={() =>
                                  modalApi.openModal("invoiceDetails", {
                                    selectedOrders: [o],
                                    linkedDeliveryNote: { docUuid: o.ezDeliveryNote?.doc_uuid ?? "", number: dnNumber(o) },
                                    requireAllocation: (o.cart?.cartTotal ?? 0) >= 5000,
                                    onInvoiceCreated: () => loadUnpaidDeliveryNotes(),
                                  })
                                }
                              >
                                <Icon icon="lucide:file-text" width={13} height={13} />
                                הפק חשבונית
                              </button>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Detail page (per organization) ──────────────────────────────────────────

const TX_TYPE_LABELS: Record<TBudgetTransactionType, string> = {
  delivery_note: "תעודת משלוח",
  payment_received: "תשלום",
  credit_note: "זיכוי",
  debit_note: "חיוב ידני",
  order_created: "הזמנה נוצרה",
  order_cancelled: "הזמנה בוטלה",
  order_refunded: "הזמנה זוכתה",
};

// Only these 3 types are shown in the ledger
const VISIBLE_TX_TYPES: TBudgetTransactionType[] = ["delivery_note", "payment_received", "credit_note"];

function txColor(type: TBudgetTransactionType): "success" | "danger" | "default" {
  if (["payment_received", "credit_note", "order_cancelled", "order_refunded"].includes(type)) return "success";
  if (["delivery_note", "debit_note", "order_created"].includes(type)) return "danger";
  return "default";
}

type BillingAccountEntry = {
  id: string;
  name: string;
  number: string;
};

export function AdminBudgetOrganizationPage() {
  const { t } = useTranslation(["common", "admin"]);
  const { organizationId } = useParams("admin.budgetOrganization");

  const [account, setAccount] = useState<TBudgetAccount | null>(null);
  const [transactions, setTransactions] = useState<TBudgetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingAccountFilter, setBillingAccountFilter] = useState<string>("");

  // manual transaction modal
  const [manualModal, setManualModal] = useState(false);
  const [manualType, setManualType] = useState<"credit_note" | "debit_note">("credit_note");
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const load = async (billingAccountId?: string) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        FirebaseApi.api.getBudgetAccount(organizationId),
        FirebaseApi.api.getBudgetTransactions(organizationId, billingAccountId || undefined),
      ]);
      if (accRes.success) setAccount(accRes.data as TBudgetAccount | null);
      if (txRes.success) setTransactions((txRes.data ?? []) as unknown as TBudgetTransaction[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(billingAccountFilter || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, billingAccountFilter]);

  // collect unique billing accounts from transactions for filter dropdown
  const billingAccounts: BillingAccountEntry[] = [];
  const seen = new Set<string>();
  for (const tx of transactions) {
    if (tx.billingAccountId && !seen.has(tx.billingAccountId)) {
      seen.add(tx.billingAccountId);
      billingAccounts.push({
        id: tx.billingAccountId,
        name: tx.billingAccountName ?? tx.billingAccountId,
        number: tx.billingAccountNumber ?? "",
      });
    }
  }

  const submitManual = async () => {
    const debt = parseFloat(manualAmount);
    if (!debt || !manualNote.trim() || !account || !organizationId) return;
    setManualLoading(true);
    await FirebaseApi.api.addBudgetManualTransaction({
      organizationId,
      organizationName: account.organizationName,
      type: manualType,
      debt,
      note: manualNote.trim(),
    });
    setManualModal(false);
    setManualAmount("");
    setManualNote("");
    setManualLoading(false);
    load(billingAccountFilter || undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          onPress={() => navigate({ to: "admin.budget" })}
        >
          <Icon icon="lucide:arrow-right" />
        </Button>
        <h1 className="text-2xl font-bold">
          {account?.organizationName ?? organizationId}
        </h1>
      </div>

      {/* Summary cards */}
      {account && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-sm text-gray-500">{t("admin:budget.totalDebits", "סה״כ חיובים")}</p>
            <p className="text-xl font-bold text-red-600">
              <Price price={account.totalDebits} />
            </p>
          </div>
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-sm text-gray-500">{t("admin:budget.totalCredits", "סה״כ תשלומים")}</p>
            <p className="text-xl font-bold text-green-600">
              <Price price={account.totalCredits} />
            </p>
          </div>
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-sm text-gray-500">{t("admin:budget.balance", "יתרת חוב")}</p>
            <p className={`text-xl font-bold ${account.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              <Price price={account.balance} />
            </p>
          </div>
        </div>
      )}

      {/* Filters + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {billingAccounts.length > 0 && (
          <div className="w-56">
            <Select
              selectedKey={billingAccountFilter || null}
              onSelectionChange={(keys: Key | null) => setBillingAccountFilter(keys ? String(keys) : "")}
              aria-label="סנן לפי חשבון חיוב"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="הכל">הכל</ListBox.Item>
                  {billingAccounts.map((ba) => (
                    <ListBox.Item key={ba.id} id={ba.id} textValue={ba.name}>
                      {ba.name} ({ba.number})
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          onPress={() => setManualModal(true)}
        >
          <Icon icon="lucide:plus" className="mr-1" />
          {t("admin:budget.addManual", "הוסף תנועה ידנית")}
        </Button>
      </div>

      {/* Transaction ledger */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Spinner />
        </div>
      ) : (
        <Table aria-label="budget transactions">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column>{t("common:date", "תאריך")}</Table.Column>
                <Table.Column>{t("admin:budget.txType", "סוג תנועה")}</Table.Column>
                <Table.Column>{t("admin:budget.amount", "סכום")}</Table.Column>
                <Table.Column>{t("admin:budget.runningBalance", "יתרה")}</Table.Column>
                <Table.Column>{t("admin:budget.document", "מסמך")}</Table.Column>
                <Table.Column>{t("admin:budget.billingAccount", "חשבון חיוב")}</Table.Column>
                <Table.Column>{t("admin:budget.paymentDetails", "פרטי תשלום")}</Table.Column>
                <Table.Column>{t("common:note", "הערה")}</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <div className="text-center py-4">{t("admin:budget.noTransactions", "אין תנועות")}</div>
                )}
              >
                {transactions.filter((tx) => VISIBLE_TX_TYPES.includes(tx.type)).map((tx) => (
                  <Table.Row key={tx.id} id={tx.id}>
                    <Table.Cell>
                      <DateView date={tx.createdAt} />
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" color={txColor(tx.type)} variant="soft">
                        <Chip.Label>{TX_TYPE_LABELS[tx.type]}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={tx.debt > 0 ? "text-red-600" : "text-green-600"}>
                        {tx.debt > 0 ? "+" : ""}
                        <Price price={tx.debt} />
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Price price={tx.runningBalance} />
                    </Table.Cell>
                    <Table.Cell>
                      {tx.type === "delivery_note" && tx.deliveryNoteNumber ? (
                        <span className="font-mono text-sm">{tx.deliveryNoteNumber}</span>
                      ) : tx.orderId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => navigate({ to: "admin.order", params: { id: tx.orderId! } })}
                        >
                          {tx.orderId.slice(0, 8)}…
                        </Button>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {tx.billingAccountName
                        ? `${tx.billingAccountName} (${tx.billingAccountNumber})`
                        : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      {tx.type === "payment_received" && tx.paymentMethod ? (
                        <span className="text-sm">
                          {tx.paymentMethod}
                          {tx.paymentReference ? ` · ${tx.paymentReference}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>
                    <Table.Cell>{tx.note ?? "—"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {/* Manual transaction modal */}
      <Modal.Backdrop isOpen={manualModal} onOpenChange={setManualModal}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t("admin:budget.addManual", "הוסף תנועה ידנית")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">סוג תנועה</label>
                  <Select
                    selectedKey={manualType}
                    onSelectionChange={(key: Key | null) =>
                      setManualType(String(key) as "credit_note" | "debit_note")
                    }
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="credit_note" textValue="זיכוי">זיכוי (מקטין חוב)</ListBox.Item>
                        <ListBox.Item id="debit_note" textValue="חיוב">חיוב (מגדיל חוב)</ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">סכום (₪)</label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">הערה</label>
                  <TextArea
                    placeholder="סיבת הזיכוי / החיוב"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => setManualModal(false)}>
                {t("common:cancel", "ביטול")}
              </Button>
              <Button
                variant="primary"
                isPending={manualLoading}
                isDisabled={!manualAmount || !manualNote.trim()}
                onPress={submitManual}
              >
                {t("common:save", "שמור")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
