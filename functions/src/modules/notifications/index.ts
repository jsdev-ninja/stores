export const notificationsModule = {} as const;

export { onOrderPlacedAdminEmail } from "./subscribers/orderPlacedAdminEmail";
export { onContactFormSubmit } from "./triggers/contactFormSubmission";
export { onLandingLeadCreated } from "./triggers/landingLead";
