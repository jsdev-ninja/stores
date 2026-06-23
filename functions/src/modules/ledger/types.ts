import { z } from "zod";

// ---------------------------------------------------------------------------
// Transaction — append-only money fact (pure cash only)
// ---------------------------------------------------------------------------

/**
 * The four real-money transaction types. AR accruals (delivery_note, invoice,
 * credit_note, adjustment with direction:"none") have been removed — they now
 * live in the documents module's organizationBalance entry ledger.
 */
export const TransactionTypeSchema = z.enum([
  "manual",
  "hyp_direct",
  "hyp_j5_auth",
  "hyp_capture",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  type: TransactionTypeSchema,
  /** Integer agorot (1 ILS = 100 agorot), always positive */
  amount: z.number().int().positive(),
  currency: z.literal("ILS"),
  /** Money flow: in = received by the store, out = refund. */
  direction: z.enum(["in", "out"]),
  reference: z
    .object({
      // "invoice" added to support recording payments against a specific invoice
      // (rather than the order as a whole). The invoice uuid is stored in `id`.
      type: z.enum(["order", "refund", "adjustment", "invoice"]),
      id: z.string().min(1),
    })
    .optional(),
  payer: z
    .object({
      organizationId: z.string().optional(),
      clientId: z.string().optional(),
      billingAccountId: z.string().optional(),
    })
    .optional(),
  hyp: z
    .object({
      masof: z.string().min(1),
      paymentToken: z.string().optional(),
      ccode: z.string().optional(),
      hypTransactionId: z.string().optional(),
      last4: z.string().optional(),
      /** Always store the full HYP response for auditability */
      rawResponse: z.record(z.unknown()),
      /** For hyp_capture: the id of the original hyp_j5_auth transaction */
      capturedFromTransactionId: z.string().optional(),
    })
    .optional(),
  /**
   * Client identity captured at auth/payment time.
   * Sourced from the customer at recordHypJ5Auth; reused by captureHypJ5.
   */
  clientName: z.string().optional(),
  email: z.string().optional(),
  actor: z.discriminatedUnion("type", [
    z.object({ type: z.literal("user"), userId: z.string().min(1) }),
    z.object({ type: z.literal("customer") }),
    z.object({ type: z.literal("system") }),
  ]),
  /** Deterministic dedup key (doc id is derived from this) */
  dedupKey: z.string().min(1),
  /**
   * Source of this transaction:
   * - subscriber  → triggered by an event
   * - api         → admin callable (idempotencyKey dedup)
   * - hyp_result  → customer-facing HYP redirect result (VERIFY-gated, HYP Id dedup)
   * - system      → internal
   */
  source: z.enum(["subscriber", "api", "hyp_result", "system"]),
  /** Present when source === "subscriber" */
  causedByEventId: z.string().optional(),
  /** epoch millis */
  createdAt: z.number().int().positive(),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// ---------------------------------------------------------------------------
// PaymentLink — short-lived HYP signed form
// ---------------------------------------------------------------------------

export const PaymentLinkSchema = z.object({
  token: z.string().min(1),
  formAction: z.string().url(),
  formFields: z.record(z.string()),
  reference: z.object({ type: z.literal("order"), id: z.string().min(1) }),
  /** Integer agorot */
  amount: z.number().int().positive(),
  currency: z.literal("ILS"),
  /** epoch millis */
  createdAt: z.number().int().positive(),
  /** epoch millis */
  expiresAt: z.number().int().positive(),
  /** epoch millis, null until consumed */
  usedAt: z.number().int().positive().nullable(),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});

export type PaymentLink = z.infer<typeof PaymentLinkSchema>;

// ---------------------------------------------------------------------------
// DuplicateChargeAlert
// ---------------------------------------------------------------------------

export const DuplicateChargeAlertSchema = z.object({
  orderId: z.string().min(1),
  transactionIds: z.array(z.string().min(1)).min(2),
  /** epoch millis */
  detectedAt: z.number().int().positive(),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});

export type DuplicateChargeAlert = z.infer<typeof DuplicateChargeAlertSchema>;
