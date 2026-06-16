import { useState } from "react";
import { Modal, Input, TextArea, Select, ListBox, Spinner, toast } from "@heroui/react";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import type { OpenInvoiceRow } from "src/lib/firebase/api";
import type { Key } from "react-aria-components";

type PaymentMethod = "cash" | "check" | "bank_transfer" | "credit_card";

type Receipt = { doc_uuid: string; pdf_link: string; doc_number: string };

type Props = {
  row: OpenInvoiceRow;
  onPaymentRecorded: (receipt: Receipt) => void;
};

/** Today as YYYY-MM-DD in Israel timezone. */
function todayIsrael(): string {
  return Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function fmtMoney(n: number): string {
  return "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: "המחאה / שיק",
  cash: "מזומן",
  bank_transfer: "העברה בנקאית",
  credit_card: "כרטיס אשראי",
};

const ERROR_MESSAGES: Record<string, string> = {
  invoice_missing: "חשבונית לא נמצאה",
  already_paid: "החשבונית כבר שולמה",
  ezcount_failed: "החיוב נשמר אבל יצירת הקבלה נכשלה. נסה שוב מאוחר יותר.",
  ledger_failed: "שמירת התשלום נכשלה. נסה שוב.",
  tenant_mismatch: "אין הרשאה לחשבונית הזו.",
  amount_mismatch: "אי התאמה בסכום.",
};

export function RecordInvoicePaymentModal({ row, onPaymentRecorded }: Props) {
  const appApi = useAppApi();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [paymentDate, setPaymentDate] = useState(todayIsrael());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setInlineError(null);
    setSubmitting(true);

    const paymentDateMs = new Date(paymentDate).getTime();

    const result = await appApi.admin.recordInvoicePayment({
      orderId: row.orderId,
      paymentMethod,
      paymentDate: paymentDateMs,
      note: note.trim() || undefined,
      idempotencyKey: `inv-pay-${row.orderId}`,
    });

    setSubmitting(false);

    if (!result) {
      setInlineError("שגיאה בלתי צפויה. נסה שוב.");
      return;
    }

    if (result.success) {
      toast.success(`תשלום נרשם בהצלחה — קבלה ${result.receipt.doc_number} הופקה`);
      onPaymentRecorded(result.receipt);
      modalApi.closeModal("recordInvoicePayment");
      return;
    }

    if (result.code === "already_paid") {
      toast.info("החשבונית כבר שולמה");
      modalApi.closeModal("recordInvoicePayment");
      onPaymentRecorded({ doc_uuid: "", pdf_link: "", doc_number: "" });
      return;
    }

    setInlineError(ERROR_MESSAGES[result.code] ?? result.error);
  };

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open && !submitting) modalApi.closeModal("recordInvoicePayment");
      }}
    >
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>
              <div className="text-start" dir="rtl">
                רישום תשלום — חשבונית {row.invoiceNumber}
              </div>
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            <div className="space-y-5" dir="rtl">
              {/* Invoice summary card */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 space-y-1 text-sm">
                <div>
                  <span className="text-[var(--muted)]">לקוח: </span>
                  <span className="font-medium">{row.displayName}</span>
                </div>
                <div>
                  <span className="text-[var(--muted)]">סכום החשבונית: </span>
                  <span className="font-semibold" style={{ color: "var(--danger)" }}>
                    {fmtMoney(row.total)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)]">שולם עד כה: </span>
                  <span>₪0.00</span>
                </div>
                <div>
                  <span className="text-[var(--muted)]">יתרה לתשלום: </span>
                  <span className="font-semibold" style={{ color: "var(--danger)" }}>
                    {fmtMoney(row.total)}
                  </span>
                </div>
              </div>

              {/* Amount + date row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    סכום ששולם <span className="text-[var(--danger)]">*</span>
                  </label>
                  <Input
                    value={fmtMoney(row.total)}
                    isDisabled
                    aria-label="סכום ששולם"
                    classNames={{ inputWrapper: "opacity-70 cursor-not-allowed" }}
                  />
                  <p className="text-xs text-[var(--muted)]">תשלום חלקי לא נתמך כרגע</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    תאריך תשלום <span className="text-[var(--danger)]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    aria-label="תאריך תשלום"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">אמצעי תשלום</label>
                <Select
                  selectedKey={paymentMethod}
                  onSelectionChange={(k: Key | null) => {
                    if (k) setPaymentMethod(k as PaymentMethod);
                  }}
                  aria-label="אמצעי תשלום"
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                        <ListBox.Item key={method} id={method} textValue={PAYMENT_METHOD_LABELS[method]}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">הערה (אופציונלי)</label>
                <TextArea
                  placeholder="למשל: מס׳ אסמכתא, תאריך פירעון..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  aria-label="הערה"
                />
              </div>

              {/* Inline error */}
              {inlineError && (
                <p className="text-sm text-[var(--danger)] font-medium">{inlineError}</p>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer>
            {submitting && <Spinner size="sm" className="me-2" />}
            <Button
              variant="ghost"
              onPress={() => modalApi.closeModal("recordInvoicePayment")}
              isDisabled={submitting}
            >
              ביטול
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              isPending={submitting}
              isDisabled={!paymentDate}
            >
              שמור תשלום
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
