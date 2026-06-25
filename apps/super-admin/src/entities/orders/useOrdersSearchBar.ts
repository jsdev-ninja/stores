import { useState, useCallback } from "react";
import type { SearchOrdersReq, TOrder } from "src/lib/saContracts";

type Fields = {
	byId: string;
	byStatus: TOrder["status"] | "";
};

type Props = {
	onSearch: (req: Omit<SearchOrdersReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function useOrdersSearchBar({ onSearch, onClear }: Props) {
	const [fields, setFields] = useState<Fields>({ byId: "", byStatus: "" });

	const handleChange = useCallback(
		<K extends keyof Fields>(key: K, value: Fields[K]) => {
			setFields((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const req: Omit<SearchOrdersReq, "companyId" | "storeId"> = {};
			if (fields.byId.trim()) req.byId = fields.byId.trim();
			if (fields.byStatus) req.byStatus = fields.byStatus;
			if (!req.byId && !req.byStatus) return;
			onSearch(req);
		},
		[fields, onSearch]
	);

	const handleClear = useCallback(() => {
		setFields({ byId: "", byStatus: "" });
		onClear();
	}, [onClear]);

	// Disable submit until at least one field has a value
	const isSubmitDisabled = !fields.byId.trim() && !fields.byStatus;

	return { fields, handleChange, handleSubmit, handleClear, isSubmitDisabled };
}
