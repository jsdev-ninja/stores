import admin from "firebase-admin";
import * as functionsV2 from "firebase-functions/v2";

admin.initializeApp({
  storageBucket: "jsdev-stores-prod.appspot.com",
});

admin.firestore().settings({ ignoreUndefinedProperties: true });

export const uiLogs = functionsV2.https.onCall((opts) => {
  const { data } = opts;
  functionsV2.logger.write(data);
});

export { chatbotApi } from "./modules/chatbot";
export { appInit } from "./modules/application";
export { getMixpanelData } from "./modules/analytics";
export { createCompanyClient, deleteClient, migrateProfilesToMultiOrg } from "./modules/customers";
// HYP payment flow (incl. legacy createPayment/chargeOrder/createPaymentRedirect/getPaymentRedirect)
// now lives entirely in the ledger module and is re-exported here.
export * from "./modules/ledger";
// Documents module — delivery notes, invoices, and AR (organizationBalance)
export {
  createDeliveryNote,
  createInvoice,
  // AR subscribers
  accrueOnDeliveryNoteCreated,
  settleOnTransactionPosted,
  // AR reconcile (admin callable + nightly schedule)
  reconcileOrganizationBalanceCallable,
  reconcileOrganizationBalanceSchedule,
  // AR read (admin callable)
  getOrganizationBalance,
  // Invoice payment callables
  getOpenInvoices,
  recordInvoicePayment,
} from "./modules/documents";
export { onSupplierInvoiceCreate } from "./modules/suppliers";
export { onContactFormSubmit, onLandingLeadCreated } from "./modules/notifications";
export {
  // Budget callables — getBudgetAccount/listBudgetAccounts/getBudgetTransactions
  // are STUBBED pending admin UI repoint (task 9). Deployed names kept stable.
  getBudgetAccount,
  listBudgetAccounts,
  getBudgetTransactions,
  markOrderPaid,
  addBudgetManualTransaction,
  // Revenue projection subscriber (cash only — AR removed)
  updateProjectionsOnTransactionPosted,
  // Revenue reconcile callable + nightly schedule
  reconcileBudgetProjections,
  reconcileProjectionsSchedule,
} from "./modules/budget";
export { getOrganizationActions } from "./api/organizationActionsApi";
export { onOrderPlacedAdminEmail } from "./modules/notifications";
export { onOrderPlacedCloseCart } from "./modules/cart";
export {
  createProduct,
  onProductCreate,
  onProductDelete,
  onProductUpdate,
} from "./modules/catalog";
export { onUserDelete } from "./modules/auth";
export { onOrderCreated, onOrderUpdate, onTransactionPostedMarkOrderPaid } from "./modules/orders";
