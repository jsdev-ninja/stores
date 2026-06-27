import { Modal, Spinner, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Button } from "src/components/button";
import { useBulkBillingModal, type CompanyGroup, type DnItem } from "./useBulkBillingModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ms: number): string {
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

// ─── DN row ───────────────────────────────────────────────────────────────────

type DnRowProps = {
  item: DnItem;
  checked: boolean;
  onChange: (orderId: string, checked: boolean) => void;
};

function DnRow({ item, checked, onChange }: DnRowProps) {
  return (
    <label
      className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--background)] transition-colors"
      dir="rtl"
    >
      <Checkbox
        isSelected={checked}
        onChange={(v) => onChange(item.orderId, v)}
        aria-label={`תעודה ${item.docNumber}`}
      />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-[var(--foreground)]">{item.docNumber}</span>
        <span className="text-xs text-[var(--muted)] ms-2">
          {fmtDate(item.date)} · {item.itemCount} פריטים
        </span>
      </div>
      <span className="text-sm font-bold text-[var(--foreground)] shrink-0">
        {fmtMoney(item.total)}
      </span>
    </label>
  );
}

// ─── Company group ────────────────────────────────────────────────────────────

type CompanyGroupRowProps = {
  group: CompanyGroup;
  selectedIds: Set<string>;
  checkState: "all" | "some" | "none";
  onToggleGroup: (orgId: string | null, checked: boolean) => void;
  onToggleOne: (orderId: string, checked: boolean) => void;
};

function CompanyGroupRow({
  group,
  selectedIds,
  checkState,
  onToggleGroup,
  onToggleOne,
}: CompanyGroupRowProps) {
  const { organizationId, companyName, items, selectedTotal, isAboveThreshold, isZeroSum } = group;

  const selectedCount = items.filter((i) => selectedIds.has(i.orderId)).length;
  const groupTotal = items.reduce((s, i) => s + i.total, 0);

  return (
    <details
      className="border border-[var(--border)] rounded-lg mb-3 bg-[var(--surface)] overflow-hidden"
      open
    >
      <summary
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        dir="rtl"
        onClick={(e) => {
          // Prevent summary toggle when clicking the checkbox area
          const target = e.target as HTMLElement;
          if (target.closest("label, input")) e.preventDefault();
        }}
      >
        <Checkbox
          isSelected={checkState === "all"}
          isIndeterminate={checkState === "some"}
          onChange={(v) => onToggleGroup(organizationId, v)}
          aria-label={`בחר את כל תעודות ${companyName}`}
        />
        <span className="flex-1 font-bold text-sm text-[var(--foreground)]">{companyName}</span>
        <span className="text-xs text-[var(--muted)]">
          {selectedCount}/{items.length} תעודות
        </span>
        <span className="font-bold text-sm text-[var(--foreground)] shrink-0">
          {fmtMoney(groupTotal)}
        </span>
      </summary>

      <div className="border-t border-[var(--border)]">
        {items.map((item) => (
          <DnRow
            key={item.orderId}
            item={item}
            checked={selectedIds.has(item.orderId)}
            onChange={onToggleOne}
          />
        ))}

        {/* Threshold / zero-sum warnings */}
        {isAboveThreshold && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] border-t border-[var(--border)] text-xs font-semibold"
            style={{ color: "var(--warning)" }}
            dir="rtl"
          >
            <Icon icon="lucide:alert-triangle" width={13} height={13} />
            נדרש מספר הקצאה (סכום נבחר {fmtMoney(selectedTotal)} ≥ ₪5,000) — הפק ידנית
          </div>
        )}
        {!isAboveThreshold && isZeroSum && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] border-t border-[var(--border)] text-xs font-semibold text-[var(--danger)]"
            dir="rtl"
          >
            <Icon icon="lucide:ban" width={13} height={13} />
            סכום אפס — לא ניתן להפיק
          </div>
        )}
      </div>
    </details>
  );
}

// ─── Results view ─────────────────────────────────────────────────────────────

type ResultsViewProps = {
  results: ReturnType<typeof useBulkBillingModal>["results"];
  onClose: () => void;
};

function ResultsView({ results, onClose }: ResultsViewProps) {
  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skipped");
  const errors = results.filter((r) => r.status === "error");

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--success)_40%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] px-4 py-3 text-sm">
        <Icon icon="lucide:check-circle-2" width={16} height={16} style={{ color: "var(--success)" }} />
        <span>
          הופקו <strong>{ok.length}</strong> חשבוניות בהצלחה
        </span>
      </div>

      {ok.length > 0 && (
        <div className="space-y-1">
          {ok.map((r) => (
            <div key={r.organizationId ?? "b2c"} className="flex items-center justify-between text-sm py-1 border-b border-[var(--border)] last:border-0">
              <span className="text-[var(--foreground)]">{r.companyName}</span>
              <span className="text-xs text-[var(--muted)] font-mono">{r.invoiceNumber}</span>
            </div>
          ))}
        </div>
      )}

      {skipped.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">דולגו</p>
          {skipped.map((r) => (
            <div key={r.organizationId ?? "b2c"} className="flex items-center justify-between text-sm py-1 border-b border-[var(--border)] last:border-0">
              <span className="text-[var(--foreground)]">{r.companyName}</span>
              <span className="text-xs" style={{ color: "var(--warning)" }}>{r.message}</span>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--danger)]">שגיאות</p>
          {errors.map((r) => (
            <div key={r.organizationId ?? "b2c"} className="flex items-center justify-between text-sm py-1 border-b border-[var(--border)] last:border-0">
              <span className="text-[var(--foreground)]">{r.companyName}</span>
              <span className="text-xs text-[var(--danger)]">{r.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="primary" onPress={onClose}>סגור</Button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  onDone?: () => void;
};

export function BulkBillingModal({ onDone }: Props) {
  const {
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
  } = useBulkBillingModal(onDone);

  const noneSelected = selectedIds.size === 0;
  const isRunning = phase === "running";

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open && !isRunning) close();
      }}
    >
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog className="max-w-[720px] w-full">
          <Modal.Header>
            <Modal.Heading>
              <div className="text-start" dir="rtl">הפקת חשבוניות מרוכזות</div>
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : phase === "done" ? (
              <ResultsView results={results} onClose={close} />
            ) : (
              <div className="space-y-4" dir="rtl">
                {/* Blurb */}
                <div className="rounded-lg border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] px-4 py-3 text-sm">
                  <strong>חיוב חכם:</strong> נמצאו{" "}
                  <strong>{groups.filter((g) => g.organizationId !== null).length}</strong> לקוחות עם תעודות שטרם חויבו.
                  {" "}בחרו אילו תעודות לכלול לכל לקוח — תופק חשבונית מס מרוכזת אחת ללקוח.
                </div>

                {groups.length === 0 ? (
                  <div className="text-center py-12 text-[var(--muted)]">
                    <Icon icon="lucide:check-circle-2" className="mx-auto mb-2 text-3xl" />
                    <p>אין תעודות משלוח שטרם חויבו לחודש זה</p>
                  </div>
                ) : (
                  <>
                    {/* Select all / clear all */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAll(true)}
                        className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-semibold"
                      >
                        סמן הכל
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAll(false)}
                        className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-semibold"
                      >
                        נקה הכל
                      </button>
                    </div>

                    {/* Company groups */}
                    <div>
                      {groups.map((group) => (
                        <CompanyGroupRow
                          key={group.organizationId ?? "__b2c__"}
                          group={group}
                          selectedIds={selectedIds}
                          checkState={groupCheckState(group.organizationId)}
                          onToggleGroup={toggleGroup}
                          onToggleOne={toggleOne}
                        />
                      ))}
                    </div>

                    {/* Live summary */}
                    <div className="rounded-lg bg-[var(--default)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)]" dir="rtl">
                      יופקו{" "}
                      <strong>{summary.invoiceCount}</strong> חשבוניות עבור{" "}
                      <strong>{summary.dnCount}</strong> תעודות משלוח · סה"כ{" "}
                      <strong>{fmtMoney(summary.totalAmount)}</strong>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal.Body>

          {phase !== "done" && (
            <Modal.Footer>
              <Button
                variant="danger"
                onPress={close}
                isDisabled={isRunning}
              >
                ביטול
              </Button>
              <Button
                variant="primary"
                onPress={execute}
                isPending={isRunning}
                isDisabled={noneSelected || loading || groups.length === 0}
              >
                הפק חשבוניות
              </Button>
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
