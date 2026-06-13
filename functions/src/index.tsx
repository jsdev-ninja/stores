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
export { createCompanyClient, migrateProfilesToMultiOrg } from "./modules/customers";
// HYP payment flow (incl. legacy createPayment/chargeOrder/createPaymentRedirect/getPaymentRedirect)
// now lives entirely in the ledger module and is re-exported here.
export * from "./modules/ledger";
export { createDeliveryNote, createInvoice } from "./modules/documents";
export { onSupplierInvoiceCreate } from "./modules/suppliers";
export { onContactFormSubmit, onLandingLeadCreated } from "./modules/notifications";
export {
  getBudgetAccount,
  listBudgetAccounts,
  getBudgetTransactions,
  markOrderPaid,
  addBudgetManualTransaction,
  increaseDebtOnOrderPlaced,
  reduceDebtOnOrderCancelled,
  reduceDebtOnOrderRefunded,
  reduceDebtOnTransactionPosted,
  updateProjectionsOnTransactionPosted,
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
