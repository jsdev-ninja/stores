import * as functions from "firebase-functions/v2";
import admin from "firebase-admin";
import { render } from "@react-email/render";
import { emailService } from "../services/email";
import ContactFormSubmitted, { TContactSubmission } from "../emails/ContactFormSubmitted";
import React from "react";


export const onContactFormSubmit = functions.firestore.onDocumentCreated(
	"{companyId}/{storeId}/contactSubmissions/{id}",
	async (event) => {
		if (!event.data) return;

		const { storeId } = event.params;
		const submission = event.data.data() as TContactSubmission;

		functions.logger.info("Contact form submitted", { storeId, submission });

		const storePrivateData = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as { storeEmail?: string } | undefined;

		const toEmail = storePrivateData?.storeEmail;
		if (!toEmail) {
			functions.logger.warn("No store email for contact form notification", { storeId });
			return;
		}

		const html = await render(<ContactFormSubmitted submission={submission} />);

		await emailService.sendEmail({
			html,
			email: toEmail,
			subject: "טופס צור קשר חדש התקבל",
		});
	}
);
