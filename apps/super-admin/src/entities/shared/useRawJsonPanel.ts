import { useState, useMemo } from "react";

export function useRawJsonPanel(data: unknown) {
	const [isOpen, setIsOpen] = useState(false);

	const toggle = () => setIsOpen((v) => !v);

	const json = useMemo(() => JSON.stringify(data, null, 2), [data]);

	return { isOpen, toggle, json };
}
