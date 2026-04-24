import admin from "firebase-admin";
import React from "react";
import { render } from "@react-email/render";
import { subscribe } from "../../../platform/eventBus";
import { emailService } from "../../../services/email";
import OrderCreated from "../../../emails/OrderCreated";
import { TOrder } from "@jsdev_ninja/core";
import { OrderEventTypes, OrderPlacedPayload } from "../../orders";

export const onOrderPlacedAdminEmail = subscribe(
	{
		name: "order-placed-admin-email",
		type: OrderEventTypes.placed,
		payloadSchema: OrderPlacedPayload,
	},
	async (event, ctx) => {
		const db = admin.firestore();

		// Fetch the full order — event payload is minimal by design.
		const orderSnap = await db
			.doc(`${ctx.companyId}/${ctx.storeId}/orders/${event.payload.orderId}`)
			.get();
		const order = orderSnap.data() as TOrder | undefined;
		if (!order) return;

		// Fetch admin email from store's private config.
		const privateSnap = await db
			.collection(`STORES/${ctx.storeId}/private`)
			.doc("data")
			.get();
		const adminEmail = (privateSnap.data() as { storeEmail?: string } | undefined)?.storeEmail;
		if (!adminEmail) return;

		const html = await render(<OrderCreated order={order} />);
		await emailService.sendEmail({ html, email: adminEmail });
	},
);
