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
export { getMixpanelData } from "./api/mixpanel-ts";
export { createCompanyClient } from "./api/createCompany";
export { createPayment } from "./api/createPayment";
export { createPaymentRedirect } from "./api/createPaymentRedirect";
export { getPaymentRedirect } from "./api/getPaymentRedirect";
export { chargeOrder } from "./api/chargeOrder";
export { createInvoice } from "./api/createInvoice";
export { createDeliveryNote } from "./api/createDeliveryNote";
export { onSupplierInvoiceCreate } from "./events/supplier-invoice-events";
export { onContactFormSubmit } from "./events/contact-form-events";
export { onLandingLeadCreated } from "./events/landing-lead-events";
export {
  getBudgetAccount,
  listBudgetAccounts,
  getBudgetTransactions,
  markOrderPaid,
  addBudgetManualTransaction,
} from "./modules/budget";
export { getOrganizationActions } from "./api/organizationActionsApi";
export { migrateProfilesToMultiOrg } from "./api/migrateProfiles";
export { onOrderPlacedAdminEmail } from "./modules/notifications";
export { onOrderPlacedCloseCart } from "./modules/cart";
export {
  onProductCreate,
  onProductDelete,
  onProductUpdate,
} from "./modules/products";
export { onUserDelete } from "./modules/auth";
export { onOrderCreated, onOrderUpdate } from "./modules/orders";
