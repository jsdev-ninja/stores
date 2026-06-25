import { useState, useCallback } from "react";
import type { SearchProductsReq } from "src/lib/saContracts";

type Fields = {
	bySku: string;
	byName: string;
};

type Props = {
	onSearch: (req: Omit<SearchProductsReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function useProductsSearchBar({ onSearch, onClear }: Props) {
	const [fields, setFields] = useState<Fields>({ bySku: "", byName: "" });

	const handleChange = useCallback(
		<K extends keyof Fields>(key: K, value: Fields[K]) => {
			setFields((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const req: Omit<SearchProductsReq, "companyId" | "storeId"> = {};
			if (fields.bySku.trim()) req.bySku = fields.bySku.trim();
			if (fields.byName.trim()) req.byName = fields.byName.trim();
			if (!req.bySku && !req.byName) return;
			onSearch(req);
		},
		[fields, onSearch]
	);

	const handleClear = useCallback(() => {
		setFields({ bySku: "", byName: "" });
		onClear();
	}, [onClear]);

	return { fields, handleChange, handleSubmit, handleClear };
}
