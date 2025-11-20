import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Invoice } from "./Invoice";
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

	const htmlString = renderToStaticMarkup(
		<Invoice
			order={order}
			store={store}
			invoiceNumber={invoiceNumber}
			invoiceDate={invoiceDate}
		/>
	);

	return htmlString;
}
