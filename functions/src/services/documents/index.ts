import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { renderInvoiceToHTML } from "../../documents/renderToHTML";
import { TOrder, TStore } from "@jsdev_ninja/core";
import admin from "firebase-admin";

type GenerateInvoicePDFOptions = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
};

class DocumentsService {
	/**
	 * Generates a PDF invoice from React component using Puppeteer
	 */
	async generateInvoicePDF(options: GenerateInvoicePDFOptions): Promise<Buffer> {
		const { order, store, invoiceNumber, invoiceDate } = options;

		// Render React component to HTML
		const html = renderInvoiceToHTML({
			order,
			store,
			invoiceNumber,
			invoiceDate,
		});

		// Configure for Firebase Functions or local development
		const isProduction = process.env.FUNCTION_TARGET || process.env.K_SERVICE;

		let launchOptions: any;

		if (isProduction) {
			// Use Chromium for Firebase Functions with memory optimization
			launchOptions = {
				args: [
					...chromium.args,
					"--hide-scrollbars",
					"--disable-web-security",
					"--single-process", // Run in single process to save memory
					"--disable-dev-shm-usage", // Overcome limited resource problems
					"--disable-gpu", // Disable GPU hardware acceleration
					"--no-zygote", // Disable zygote process
					"--disable-setuid-sandbox",
				],
				defaultViewport: chromium.defaultViewport,
				executablePath: await chromium.executablePath(),
				headless: true,
			};
		} else {
			// Use local Chrome for development
			launchOptions = {
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--disable-gpu",
				],
			};
		}

		// Launch Puppeteer browser
		const browser = await puppeteer.launch(launchOptions);

		try {
			const page = await browser.newPage();

			// Block external resources to save memory (we use inline styles)
			await page.setRequestInterception(true);
			page.on("request", (req) => {
				const resourceType = req.resourceType();
				// Block external stylesheets and fonts (we use inline styles)
				// Allow images for product images in invoice
				if (resourceType === "stylesheet" || resourceType === "font") {
					req.abort();
				} else {
					req.continue();
				}
			});

			// Set content with optimized wait strategy to save memory
			await page.setContent(html, {
				waitUntil: "domcontentloaded", // Faster than networkidle0, uses less memory
			});
			
			// Wait a bit for images to load if needed
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Generate PDF
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "20mm",
					right: "15mm",
					bottom: "20mm",
					left: "15mm",
				},
			});

			return Buffer.from(pdfBuffer);
		} finally {
			await browser.close();
		}
	}

	/**
	 * Generates PDF invoice and uploads to Firebase Storage
	 */
	async generateAndUploadInvoicePDF(
		options: GenerateInvoicePDFOptions & {
			companyId: string;
			storeId: string;
			orderId: string;
		}
	): Promise<string> {
		const { companyId, storeId, orderId, ...pdfOptions } = options;

		// Generate PDF
		const pdfBuffer = await this.generateInvoicePDF(pdfOptions);

		// Upload to Firebase Storage
		const bucket = admin.storage().bucket();
		const fileName = `invoices/${companyId}/${storeId}/${orderId}-${Date.now()}.pdf`;
		const file = bucket.file(fileName);

		await file.save(pdfBuffer, {
			metadata: {
				contentType: "application/pdf",
			},
		});

		// Make file publicly accessible
		await file.makePublic();

		const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

		return pdfUrl;
	}
}

export const documentsService = new DocumentsService();

