import { useState, useCallback } from "react";
import type { SearchProfilesReq } from "src/lib/saContracts";

type Fields = {
	byEmail: string;
	byPhone: string;
};

type Props = {
	onSearch: (req: Omit<SearchProfilesReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function useProfilesSearchBar({ onSearch, onClear }: Props) {
	const [fields, setFields] = useState<Fields>({ byEmail: "", byPhone: "" });

	const handleChange = useCallback(
		<K extends keyof Fields>(key: K, value: Fields[K]) => {
			setFields((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const req: Omit<SearchProfilesReq, "companyId" | "storeId"> = {};
			if (fields.byEmail.trim()) req.byEmail = fields.byEmail.trim();
			if (fields.byPhone.trim()) req.byPhone = fields.byPhone.trim();
			if (!req.byEmail && !req.byPhone) return;
			onSearch(req);
		},
		[fields, onSearch]
	);

	const handleClear = useCallback(() => {
		setFields({ byEmail: "", byPhone: "" });
		onClear();
	}, [onClear]);

	// Disable submit until at least one field has a value
	const isSubmitDisabled = !fields.byEmail.trim() && !fields.byPhone.trim();

	return { fields, handleChange, handleSubmit, handleClear, isSubmitDisabled };
}
