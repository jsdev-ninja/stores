import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Invoice } from "./templates/Invoice";
import { DeliveryNote } from "./templates/DeliveryNote";
import { TOrder, TOrganization, TStore } from "@jsdev_ninja/core";

type RenderInvoiceOptions = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
};

type RenderDeliveryNoteOptions = {
	order: TOrder;
	store: TStore;
	organization?: TOrganization;
	deliveryNoteNumber?: string;
	deliveryNoteDate?: string;
};

/**
 * Renders React invoice component to HTML string
 */
export function renderInvoiceToHTML(options: RenderInvoiceOptions): string {
	const { order, store, invoiceNumber, invoiceDate } = options;

	const invoiceNum = invoiceNumber || order.invoice?.number;

	const htmlString = renderToStaticMarkup(
		<html dir="rtl" lang="he">
			<head>
				<meta charSet="UTF-8" />
				<title>חשבונית {invoiceNum}</title>
			</head>
			<body
				style={{
					fontFamily: "Arial, sans-serif",
					direction: "rtl",
					padding: "40px",
					backgroundColor: "#fff",
					color: "#333",
				}}
			>
				<Invoice
					order={order}
					store={store}
					invoiceNumber={invoiceNumber}
					invoiceDate={invoiceDate}
				/>
			</body>
		</html>
	);

	return htmlString;
}

/**
 * Renders React delivery note component to HTML string
 */
export function renderDeliveryNoteToHTML(options: RenderDeliveryNoteOptions): string {
	const { order, store, organization, deliveryNoteNumber, deliveryNoteDate } = options;

	const noteNum = deliveryNoteNumber;

	const htmlString = renderToStaticMarkup(
		<html dir="rtl" lang="he">
			<head>
				<meta charSet="UTF-8" />
				<title>תעודת משלוח {noteNum}</title>
			</head>
			<body
				style={{
					fontFamily: "Arial, sans-serif",
					direction: "rtl",
					padding: "40px",
					backgroundColor: "#fff",
					color: "#333",
				}}
			>
				<DeliveryNote
					order={order}
					store={store}
					organization={organization}
					deliveryNoteNumber={deliveryNoteNumber}
					deliveryNoteDate={deliveryNoteDate}
				/>
			</body>
		</html>
	);

	return htmlString;
}
