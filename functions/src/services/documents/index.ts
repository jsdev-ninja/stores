import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

type GenerateInvoicePDFOptions = {
	html: string;
};

class DocumentsService {
	/**
	 * Generates a PDF from html
	 */
	async createDocumentPdf(options: GenerateInvoicePDFOptions): Promise<Buffer> {
		const { html } = options;

		const launchOptions = {
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
}

export const documentsService = new DocumentsService();
