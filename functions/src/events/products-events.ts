import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const updateProductsCategory = functions.https.onRequest(async (req, res) => {
	try {
		const db = admin.firestore();

		const size = 500;

		const categories = [
			{
				id: 1,
				name: "products",
				children: [
					{
						name: "fruits",
					},
				],
			},
			{
				id: 1,
				name: "goods",
				children: [
					{
						name: "to eat",
					},
				],
			},
		];

		const productsRef = db.collection("test");
		const shapshot = await productsRef.count().get();

		await productsRef.add({
			name: "lemon",
			"categories.lvl0": ["products", "goods"],
			"categories.lvl1": ["products > fruits", "goods > to eat"],
		});

		await productsRef.add({
			name: "banana",
			"categories.lvl0": ["products"],
			"categories.lvl1": ["products > fruits"],
		});

		const allDocsSize = shapshot.data().count;
		const total = Math.ceil(allDocsSize / size);

		for (let i = 0; i < total; i++) {
			const batch = db.batch();

			const products = await productsRef
				.limit(size)
				.offset(i + size)
				.get();

			products.forEach((product) => {
				const id = product.id;
				const data = product.data();

				const docRef = db.collection("products").doc(id);
				batch.update(docRef, { population: 1000000 });
			});
			await batch.commit();
		}

		res.json({ message: "success", count: shapshot.data().count });
	} catch (error) {
		res.json(error);
	}
});
