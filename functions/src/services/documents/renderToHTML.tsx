import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Invoice } from "./templates/Invoice";
import { TOrder, TStore } from "@jsdev_ninja/core";

type RenderInvoiceOptions = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
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
