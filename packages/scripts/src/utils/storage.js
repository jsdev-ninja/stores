import { getDownloadURL, getStorage } from "firebase-admin/storage";

import { app } from "./app.js";

export const storageApi = {
	async uploadFile({ file, name }) {
		return new Promise((resolve, reject) => {
			file
				.pipe(getStorage(app).bucket().file(name).createWriteStream())
				.on("finish", async () => {
					const a = getStorage(app).bucket().file(name);
					const url = await getDownloadURL(a);
					resolve({ url, id: crypto.randomUUID() });
				})
				.on("error", (e) => {
					console.log("E", e?.message);
					reject();
				});
		});
	},
	async getUrl({ name }) {
		const a = getStorage(app).bucket().file(name);
		const url = await getDownloadURL(a);
		return url;
	},
};
