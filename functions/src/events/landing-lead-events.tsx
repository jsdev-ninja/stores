import * as functions from "firebase-functions/v2";
import { render } from "@react-email/render";
import { emailService } from "../services/email";
import ContactFormSubmitted from "../emails/ContactFormSubmitted";
import React from "react";

const NOTIFY_EMAIL = "philip@jsdev.ninja";

export const onLandingLeadCreated = functions.firestore.onDocumentCreated(
	"landingLeads/{id}",
	async (event) => {
		if (!event.data) return;

		const data = event.data.data();

		functions.logger.info("Landing lead submitted", { data });

		const submission = {
			name: data.name ?? "",
			email: data.email ?? "",
			company: data.company ?? "",
			phone: data.phone,
			message: data.message,
			createdAt: data.createdAt ?? Date.now(),
		};

		const html = await render(<ContactFormSubmitted submission={submission} />);

		await emailService.sendEmail({
			html,
			email: NOTIFY_EMAIL,
			subject: "🚀 ליד חדש מ-StoreBrix.com",
		});
	}
);
