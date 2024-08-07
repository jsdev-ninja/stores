import { useMemo } from "react";
import { TCategory } from "src/domains/Category";
import { useCompany } from "src/domains/Company";
import { OrderApi } from "src/domains/Order";
import { useStore } from "src/domains/Store";
import { FirebaseApi } from "src/lib/firebase";

// should be ready before use
// store
// firebase

export const useAppApi = () => {
	const company = useCompany();
	const store = useStore();
	console.log("useAppApi", store);

	// orders

	const isValid = !!company?.id && store?.id;

	const api = useMemo(() => {
		const orders = {
			list: async () => {
				const res = await FirebaseApi.firestore.list("orders");
				return res;
			},
			order: async ({ cart }: any) => {
				if (!isValid) return;

				return await OrderApi.createOrder({
					companyId: company.id,
					storeId: store.id,
					cart: cart.items,
					status: "pending",
					paymentStatus: "notPaid",
					date: Date.now(),
				});
			},
		};

		const admin = {
			category: {
				create: async (category: TCategory) => {
					if (!isValid) return;

					return await FirebaseApi.firestore.update(
						store.id,
						{
							categories: FirebaseApi.firestore.arrayUnion(category),
						},
						"categories"
					);
				},
				update: async (categories: TCategory[]) => {
					if (!isValid) return;

					return await FirebaseApi.firestore.update(
						store.id,
						{
							categories: categories,
						},
						"categories"
					);
				},
			},
		};

		return { orders, admin };
	}, [store]);

	return api;
};
