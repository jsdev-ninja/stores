import { useMemo } from "react";
import { TCategory } from "src/domains/Category";
import { useCompany } from "src/domains/Company";
import { OrderApi } from "src/domains/Order";
import { useStore } from "src/domains/Store";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";

// should be ready before use
// store
// firebase

export const useAppApi = () => {
	const company = useCompany();
	const store = useStore();
	const user = useAppSelector((state) => state.user.user);

	const isValid = !!company?.id && store?.id && !!user?.uid;

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
					type: "order",
					userId: user.uid,
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
