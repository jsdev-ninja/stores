import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Invoice } from "./templates/Invoice";
import { DeliveryNote } from "./templates/DeliveryNote";
import { TOrder, TStore } from "@jsdev_ninja/core";

type RenderInvoiceOptions = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
};

type RenderDeliveryNoteOptions = {
	order: TOrder;
	store: TStore;
	deliveryNoteNumber?: string;
	deliveryNoteDate?: string;
};

/**
 * Renders React invoice component to HTML string
 */
export function renderInvoiceToHTML(options: RenderInvoiceOptions): string {
	const { order, store, invoiceNumber, invoiceDate } = options;

	const invoiceNum = invoiceNumber || order.invoice?.doc_number || order.id;

	const htmlString = renderToStaticMarkup(
		<html dir="rtl" lang="he">
			<head>
				<meta charSet="UTF-8" />
				<title>חשבונית {invoiceNum}</title>
			</head>
			<body style={{ fontFamily: "Arial, sans-serif", direction: "rtl", padding: "40px", backgroundColor: "#fff", color: "#333" }}>
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
	const { order, store, deliveryNoteNumber, deliveryNoteDate } = options;

	const deliveryNote = order.deliveryNote!;
	const docNumber = 'doc_number' in deliveryNote 
		? (deliveryNote as any).doc_number 
		: ('number' in deliveryNote ? (deliveryNote as any).number : '');
	const noteNum = deliveryNoteNumber || docNumber || order.id;

	const htmlString = renderToStaticMarkup(
		<html dir="rtl" lang="he">
			<head>
				<meta charSet="UTF-8" />
				<title>תעודת משלוח {noteNum}</title>
			</head>
			<body style={{ fontFamily: "Arial, sans-serif", direction: "rtl", padding: "40px", backgroundColor: "#fff", color: "#333" }}>
				<DeliveryNote
					order={order}
					store={store}
					deliveryNoteNumber={deliveryNoteNumber}
					deliveryNoteDate={deliveryNoteDate}
				/>
			</body>
		</html>
	);

	return htmlString;
}
