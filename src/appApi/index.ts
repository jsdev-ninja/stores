import { useMemo } from "react";
import { useAppSelector } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";

export const useAppApi = () => {
	const store = useAppSelector((state) => state.store.data);

	// orders

	const api = useMemo(() => {
		const orders = {
			list: async () => {
				const res = await FirebaseApi.firestore.list("orders");
				return res;
			},
		};

		return { orders };
	}, [store]);

	return api;
};
