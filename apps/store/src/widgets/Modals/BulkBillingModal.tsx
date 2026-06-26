import { useEffect, useMemo, useState } from "react";
import { Modal, Input, Checkbox, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import { useApiState } from "src/appApi/useApiState";
import { FirebaseApi } from "src/lib/firebase";
import { VAT_TYPE, type Params } from "src/lib/firebase/api";
import type { TOrder, TOrganization, TAddress } from "@jsdev_ninja/core";

// ITA חשבונית ישראל allocation-number threshold (shekels). Mirrors the backend
// gate in functions/src/modules/documents/api/createInvoice.ts.
const ALLOCATION_THRESHOLD_ILS = 5000;

// How far back to look for unbilled delivery notes.
const LOOKBACK_DAYS = 365;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleDateString("he-IL");
  } catch {
    return "—";
  }
}

function fmtMoney(n: number): string {
  return "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Today as DD/MM/YYYY in Israel timezone (EZcount's expected date format). */
function todayIsraelDDMMYYYY(): string {
  return Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addressToString(a?: TAddress): string {
  if (!a) return "";
  return [a.street, a.streetNumber, a.city].filter(Boolean).join(" ");
}

// Delivery-note field helpers (mirrors AdminOrganizationsPage).
function dnNumber(o: TOrder): string {
  return o.deliveryNote?.number ?? o.ezDeliveryNote?.doc_number ?? "—";
}
function dnDate(o: TOrder): number {
  return o.deliveryNote?.date ?? o.date;
}
function dnItemCount(o: TOrder): number {
  return o.deliveryNote?.items?.length ?? o.cart?.items?.length ?? 0;
}
// Invoice math uses cart.cartTotal — same basis InvoiceDetailsModal bills on, so
// the displayed total, the threshold check, and the issued invoice all agree.
function noteAmount(o: TOrder): number {
  return o.cart?.cartTotal ?? 0;
}
/** A delivery note is "unbilled" when no invoice has been issued from it yet. */
function isUnbilled(o: TOrder): boolean {
  return !o.ezInvoice?.doc_number && !o.invoice;
}

// ─── Types ──────────────────────────────────────────────────────────────────

type CompanyGroup = {
  org: TOrganization;
  notes: TOrder[];
};

type RunResult = {
  companyName: string;
  status: "ok" | "error" | "skipped";
  invoiceNumber?: string;
  message?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkBillingModal({ onDone }: { onDone?: () => void }) {
  const appApi = useAppApi();
  const { store } = useApiState();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  // Delivery notes that have no organization — unexpected (no B2C customers).
  const [orphanCount, setOrphanCount] = useState(0);

  const [selectedDnIds, setSelectedDnIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [allocationByOrg, setAllocationByOrg] = useState<Record<string, string>>({});

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const now = Date.now();
        const fromDate = now - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
        const dnResult = await appApi.admin.getDeliveryNotes({ fromDate, toDate: now });
        const orgResult = await appApi.admin.listOrganizations();
        if (!active) return;

        const orders = (dnResult?.success ? dnResult.data ?? [] : []) as TOrder[];
        const organizations = (orgResult?.success ? orgResult.data ?? [] : []) as TOrganization[];
        const orgById = new Map(organizations.map((o) => [o.id, o]));

        const unbilled = orders.filter(isUnbilled);

        const byOrg = new Map<string, TOrder[]>();
        let orphans = 0;
        for (const o of unbilled) {
          const orgId = o.organizationId;
          if (!orgId || !orgById.has(orgId)) {
            orphans += 1;
            continue;
          }
          const list = byOrg.get(orgId) ?? [];
          list.push(o);
          byOrg.set(orgId, list);
        }

        const nextGroups: CompanyGroup[] = [...byOrg.entries()]
          .map(([orgId, notes]) => ({
            org: orgById.get(orgId)!,
            notes: notes.sort((a, b) => dnDate(b) - dnDate(a)),
          }))
          .sort((a, b) => a.org.name.localeCompare(b.org.name, "he"));

        setGroups(nextGroups);
        setOrphanCount(orphans);
        // Default: everything selected, every group expanded.
        setSelectedDnIds(new Set(unbilled.filter((o) => o.organizationId && orgById.has(o.organizationId)).map((o) => o.id)));
        setCollapsed(new Set());
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appApi stable; run once
  }, []);

  // ── Selection helpers ────────────────────────────────────────────────────

  function toggleNote(id: string, checked: boolean) {
    setSelectedDnIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleCompany(group: CompanyGroup, checked: boolean) {
    setSelectedDnIds((prev) => {
      const next = new Set(prev);
      for (const o of group.notes) {
        if (checked) next.add(o.id);
        else next.delete(o.id);
      }
      return next;
    });
  }

  function toggleCollapse(orgId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  }

  function selectAll(checked: boolean) {
    if (!checked) {
      setSelectedDnIds(new Set());
      return;
    }
    setSelectedDnIds(new Set(groups.flatMap((g) => g.notes.map((o) => o.id))));
  }

  // ── Derived selection state ───────────────────────────────────────────────

  const selectedByOrg = useMemo(() => {
    const map = new Map<string, TOrder[]>();
    for (const g of groups) {
      const sel = g.notes.filter((o) => selectedDnIds.has(o.id));
      if (sel.length) map.set(g.org.id, sel);
    }
    return map;
  }, [groups, selectedDnIds]);

  const summary = useMemo(() => {
    let companies = 0;
    let notes = 0;
    let total = 0;
    for (const sel of selectedByOrg.values()) {
      companies += 1;
      notes += sel.length;
      total += sel.reduce((s, o) => s + noteAmount(o), 0);
    }
    return { companies, notes, total };
  }, [selectedByOrg]);

  /** Companies whose selected total crosses the threshold and still need a number. */
  const missingAllocation = useMemo(() => {
    const ids: string[] = [];
    for (const [orgId, sel] of selectedByOrg.entries()) {
      const sum = sel.reduce((s, o) => s + noteAmount(o), 0);
      if (sum >= ALLOCATION_THRESHOLD_ILS && !(allocationByOrg[orgId]?.trim())) {
        ids.push(orgId);
      }
    }
    return new Set(ids);
  }, [selectedByOrg, allocationByOrg]);

  const canRun = summary.companies > 0 && missingAllocation.size === 0 && !running;

  // ── Execute ───────────────────────────────────────────────────────────────

  async function handleRun() {
    if (!store || !canRun) return;
    setRunning(true);
    const collected: RunResult[] = [];
    try {
      for (const [orgId, notes] of selectedByOrg.entries()) {
        const group = groups.find((g) => g.org.id === orgId);
        const org = group?.org;
        const companyName = org?.nameOnInvoice || org?.name || "—";
        const sum = notes.reduce((s, o) => s + noteAmount(o), 0);
        const allocationNumber = allocationByOrg[orgId]?.trim();

        if (sum >= ALLOCATION_THRESHOLD_ILS && !allocationNumber) {
          // Defensive — canRun already blocks this, but never bill without a
          // mandated allocation number.
          collected.push({
            companyName,
            status: "skipped",
            message: "נדרש מספר הקצאה",
          });
          continue;
        }

        const params: Params = {
          item: notes.map((o) => ({
            details: `תעודת משלוח ${o.ezDeliveryNote?.doc_number ?? ""}`,
            price: noteAmount(o),
            amount: 1,
            vat_type: VAT_TYPE.NON,
          })),
          transaction_id: crypto.randomUUID(),
          customer_name: companyName,
          customer_email: org?.email || notes[0]?.client?.email || "",
          customer_address: addressToString(org?.address) || "",
          customer_phone: org?.phone || notes[0]?.client?.phoneNumber || "",
          description: "חשבונית מרוכזת",
          price_total: sum,
          parent: notes.map((o) => o.ezDeliveryNote?.doc_uuid).filter(Boolean).join(","),
          ...(allocationNumber ? { allocationNumber } : {}),
          date: todayIsraelDDMMYYYY(),
        };

        try {
          // api.createInvoice wraps the callable: res.success is true unless the
          // call threw; the cloud function's own result is in res.data, shaped
          // { success: true, data: ezInvoice } | { success: false, error }.
          const res = await FirebaseApi.api.createInvoice(store.id, { orders: notes, params });
          const fnResult = res?.data as
            | { success?: boolean; error?: string; data?: { doc_number?: string } }
            | null;
          if (res?.success && fnResult?.success === true) {
            collected.push({
              companyName,
              status: "ok",
              invoiceNumber: fnResult.data?.doc_number,
            });
          } else {
            collected.push({
              companyName,
              status: "error",
              message: fnResult?.error ?? "שגיאה ביצירת החשבונית",
            });
          }
        } catch (e) {
          collected.push({
            companyName,
            status: "error",
            message: e instanceof Error ? e.message : "שגיאה לא צפויה",
          });
        }
      }

      setResults(collected);
      const okCount = collected.filter((r) => r.status === "ok").length;
      const failCount = collected.length - okCount;
      if (okCount > 0) {
        toast.success(`הופקו ${okCount} חשבוניות${failCount ? ` · ${failCount} נכשלו` : ""}`);
      } else if (failCount > 0) {
        toast.danger("הפקת החשבוניות נכשלה", { description: "ראה פירוט במסך" });
      }
      onDone?.();
    } finally {
      setRunning(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const close = () => modalApi.closeModal("bulkBilling");

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) close(); }}>
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog className="max-w-[820px] w-full">
          <Modal.Header>
            <Modal.Heading>
              <div className="text-start">הפקת חשבוניות מרוכזות</div>
              <div className="text-sm text-default-500 text-start">
                קיבוץ תעודות משלוח שלא חויבו לפי חברה — חשבונית מרכזת אחת לכל חברה
              </div>
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Spinner size="lg" />
              </div>
            ) : results ? (
              // ── Results view ──────────────────────────────────────────────
              <div className="space-y-2" dir="rtl">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[var(--foreground)]">{r.companyName}</span>
                    {r.status === "ok" ? (
                      <span className="inline-flex items-center gap-1 text-[var(--success)]">
                        <Icon icon="lucide:check-circle" width={15} height={15} />
                        חשבונית {r.invoiceNumber ?? "הופקה"}
                      </span>
                    ) : r.status === "skipped" ? (
                      <span className="inline-flex items-center gap-1 text-[var(--warning)]">
                        <Icon icon="lucide:alert-triangle" width={15} height={15} />
                        {r.message}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--danger)]">
                        <Icon icon="lucide:x-circle" width={15} height={15} />
                        {r.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16 text-[var(--muted)]" dir="rtl">
                <Icon icon="lucide:check-check" className="mx-auto mb-3 text-4xl" />
                <p>אין תעודות משלוח שממתינות לחיוב</p>
              </div>
            ) : (
              // ── Selection view ────────────────────────────────────────────
              <div className="space-y-3" dir="rtl">
                {orphanCount > 0 && (
                  <div className="rounded-lg border border-[var(--warning)] bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] px-3 py-2 text-sm text-[var(--warning)]">
                    {orphanCount} תעודות משלוח ללא חברה משויכת — לא ניתן לכלול אותן בהפקה מרוכזת.
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => selectAll(true)}
                    className="text-sm font-semibold text-[var(--accent)] hover:underline"
                  >
                    סמן הכל
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAll(false)}
                    className="text-sm font-semibold text-[var(--muted)] hover:underline"
                  >
                    נקה הכל
                  </button>
                </div>

                {groups.map((g) => {
                  const selected = g.notes.filter((o) => selectedDnIds.has(o.id));
                  const allSelected = selected.length === g.notes.length;
                  const groupSum = selected.reduce((s, o) => s + noteAmount(o), 0);
                  const needsAllocation = groupSum >= ALLOCATION_THRESHOLD_ILS && selected.length > 0;
                  const isCollapsed = collapsed.has(g.org.id);

                  return (
                    <div
                      key={g.org.id}
                      className="rounded-xl border border-[var(--border)] overflow-hidden"
                    >
                      {/* Company header */}
                      <div className="flex items-center gap-3 px-3 py-2 bg-[var(--background)]">
                        <Checkbox
                          isSelected={allSelected}
                          onChange={(checked) => toggleCompany(g, checked)}
                          aria-label={`בחר את כל התעודות של ${g.org.name}`}
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox>
                        <button
                          type="button"
                          onClick={() => toggleCollapse(g.org.id)}
                          className="flex items-center gap-2 flex-1 text-start"
                        >
                          <Icon
                            icon={isCollapsed ? "lucide:chevron-left" : "lucide:chevron-down"}
                            width={16}
                            height={16}
                            className="text-[var(--muted)]"
                          />
                          <span className="font-bold text-sm text-[var(--foreground)]">
                            {g.org.name}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {selected.length}/{g.notes.length} תעודות
                          </span>
                        </button>
                        <span className="font-bold text-sm text-[var(--foreground)]">
                          {fmtMoney(groupSum)}
                        </span>
                      </div>

                      {/* Allocation input (>= threshold) */}
                      {needsAllocation && (
                        <div className="px-3 py-2 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--warning)_7%,transparent)]">
                          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                            מספר הקצאה (חשבונית ישראל) — נדרש מעל {fmtMoney(ALLOCATION_THRESHOLD_ILS)}
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="9 ספרות"
                            value={allocationByOrg[g.org.id] ?? ""}
                            onChange={(e) =>
                              setAllocationByOrg((prev) => ({ ...prev, [g.org.id]: e.target.value }))
                            }
                            className="text-start w-56"
                          />
                        </div>
                      )}

                      {/* Delivery-note rows */}
                      {!isCollapsed && (
                        <div className="divide-y divide-[var(--border)]">
                          {g.notes.map((o) => (
                            <div key={o.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                              <Checkbox
                                isSelected={selectedDnIds.has(o.id)}
                                onChange={(checked) => toggleNote(o.id, checked)}
                                aria-label={`בחר תעודת משלוח ${dnNumber(o)}`}
                              >
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox>
                              <span className="font-semibold text-[var(--foreground)] w-28">
                                {dnNumber(o)}
                              </span>
                              <span className="text-[var(--muted)] w-24">{fmtDate(dnDate(o))}</span>
                              <span className="text-[var(--muted)] flex-1">
                                {dnItemCount(o)} פריטים
                              </span>
                              <span className="font-bold text-[var(--foreground)]">
                                {fmtMoney(noteAmount(o))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            {results ? (
              <Button variant="primary" onPress={close}>
                סגור
              </Button>
            ) : (
              <>
                <div className="flex-1 text-start text-sm text-[var(--muted)]" dir="rtl">
                  {summary.companies > 0 ? (
                    <>
                      יופקו <b className="text-[var(--foreground)]">{summary.companies}</b> חשבוניות עבור{" "}
                      <b className="text-[var(--foreground)]">{summary.notes}</b> תעודות · סה"כ{" "}
                      <b className="text-[var(--foreground)]">{fmtMoney(summary.total)}</b>
                      {missingAllocation.size > 0 && (
                        <span className="text-[var(--warning)]">
                          {" "}· חסר מספר הקצאה ל-{missingAllocation.size} חברות
                        </span>
                      )}
                    </>
                  ) : (
                    "לא נבחרו תעודות"
                  )}
                </div>
                <Button variant="danger" onPress={close} isDisabled={running}>
                  ביטול
                </Button>
                <Button variant="primary" onPress={handleRun} isPending={running} isDisabled={!canRun}>
                  הפק חשבוניות
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
